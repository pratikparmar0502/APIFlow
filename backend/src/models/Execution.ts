import mongoose, { Document, Schema } from 'mongoose';
import { WorkflowStatus, StepResult } from '../types';

export interface IExecution extends Document {
  workflowId?: mongoose.Types.ObjectId;
  workflowName: string;
  workflowSnapshot: {
    nodes: unknown[];
    edges: unknown[];
  };
  status: WorkflowStatus;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  stepResults: StepResult[];
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  error?: string;
  createdAt: Date;
}

const AssertionResultSchema = new Schema({
  assertionId: String,
  type: String,
  description: String,
  passed: Boolean,
  expected: Schema.Types.Mixed,
  actual: Schema.Types.Mixed,
  message: String,
}, { _id: false });

const ExtractionResultSchema = new Schema({
  variableName: String,
  value: Schema.Types.Mixed,
  success: Boolean,
  error: String,
}, { _id: false });

const StepResultSchema = new Schema({
  nodeId: { type: String, required: true },
  label: String,
  status: { type: String, enum: ['pending', 'running', 'passed', 'failed', 'skipped'], required: true },
  startedAt: Date,
  completedAt: Date,
  durationMs: Number,
  requestUrl: String,
  requestMethod: String,
  responseStatus: Number,
  responseHeaders: Schema.Types.Mixed,
  responseBodyPreview: String, // Truncated to 2000 chars
  responseSize: Number,
  assertionResults: { type: [AssertionResultSchema], default: [] },
  extractionResults: { type: [ExtractionResultSchema], default: [] },
  error: String,
}, { _id: false });

const ExecutionSchema = new Schema<IExecution>({
  workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', index: true },
  workflowName: { type: String, required: true },
  workflowSnapshot: {
    nodes: { type: [Schema.Types.Mixed], default: [] },
    edges: { type: [Schema.Types.Mixed], default: [] },
  },
  status: { type: String, enum: ['pending', 'running', 'passed', 'failed', 'cancelled'], required: true },
  startedAt: { type: Date, required: true },
  completedAt: Date,
  durationMs: Number,
  stepResults: { type: [StepResultSchema], default: [] },
  totalSteps: { type: Number, default: 0 },
  passedSteps: { type: Number, default: 0 },
  failedSteps: { type: Number, default: 0 },
  skippedSteps: { type: Number, default: 0 },
  error: String,
}, {
  timestamps: true,
  versionKey: false,
});

ExecutionSchema.index({ workflowId: 1, createdAt: -1 });
ExecutionSchema.index({ status: 1 });
ExecutionSchema.index({ createdAt: -1 });

export const Execution = mongoose.model<IExecution>('Execution', ExecutionSchema);
