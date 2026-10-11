import mongoose, { Document, Schema } from 'mongoose';
import { WorkflowNode, WorkflowEdge, WorkflowSettings } from '../types';

export interface IWorkflow extends Document {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  settings: WorkflowSettings;
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
}

const QueryParamSchema = new Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
  enabled: { type: Boolean, default: true },
}, { _id: false });

const HeaderSchema = new Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
  enabled: { type: Boolean, default: true },
}, { _id: false });

const AssertionConfigSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['status', 'jsonPath', 'exists', 'typeCheck', 'responseTime'], required: true },
  target: String,
  operator: { type: String, enum: ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'contains', 'exists'] },
  expected: Schema.Types.Mixed,
  description: String,
}, { _id: false });

const ExtractionRuleSchema = new Schema({
  id: { type: String, required: true },
  variableName: { type: String, required: true },
  source: { type: String, enum: ['responseJson', 'responseHeader', 'responseStatus'], required: true },
  jsonPath: String,
  headerName: String,
}, { _id: false });

const RequestConfigSchema = new Schema({
  url: { type: String, required: true },
  method: { type: String, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'], required: true },
  queryParams: { type: [QueryParamSchema], default: [] },
  headers: { type: [HeaderSchema], default: [] },
  body: String,
  timeoutMs: { type: Number, min: 100, max: 60000 },
  assertions: { type: [AssertionConfigSchema], default: [] },
  extractionRules: { type: [ExtractionRuleSchema], default: [] },
}, { _id: false });

const WorkflowNodeSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['request'], required: true },
  label: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  config: { type: RequestConfigSchema, required: true },
}, { _id: false });

const WorkflowEdgeSchema = new Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
}, { _id: false });

const WorkflowSettingsSchema = new Schema({
  continueOnFailure: { type: Boolean, default: false },
  maxExecutionTimeMs: { type: Number, default: 120000 },
}, { _id: false });

const WorkflowSchema = new Schema<IWorkflow>({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 1000 },
  nodes: { type: [WorkflowNodeSchema], default: [] },
  edges: { type: [WorkflowEdgeSchema], default: [] },
  settings: { type: WorkflowSettingsSchema, default: () => ({}) },
  schemaVersion: { type: Number, default: 1 },
}, {
  timestamps: true,
  versionKey: false,
});

WorkflowSchema.index({ name: 1 });
WorkflowSchema.index({ createdAt: -1 });
WorkflowSchema.index({ updatedAt: -1 });

export const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
