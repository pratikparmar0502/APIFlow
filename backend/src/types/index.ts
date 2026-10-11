export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export type StepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
export type WorkflowStatus = 'pending' | 'running' | 'passed' | 'failed' | 'cancelled';

export interface QueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

export interface AssertionConfig {
  id: string;
  type: 'status' | 'jsonPath' | 'exists' | 'typeCheck' | 'responseTime';
  target?: string;     // JSON path for jsonPath/exists/typeCheck
  operator?: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'exists';
  expected?: string | number | boolean;
  description?: string;
}

export interface ExtractionRule {
  id: string;
  variableName: string;
  source: 'responseJson' | 'responseHeader' | 'responseStatus';
  jsonPath?: string;   // for responseJson
  headerName?: string; // for responseHeader
}

export interface RequestConfig {
  url: string;
  method: HttpMethod;
  queryParams: QueryParam[];
  headers: Header[];
  body?: string;       // JSON string
  timeoutMs?: number;
  assertions: AssertionConfig[];
  extractionRules: ExtractionRule[];
}

export interface WorkflowNode {
  id: string;
  type: 'request';
  label: string;
  position: { x: number; y: number };
  config: RequestConfig;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowSettings {
  continueOnFailure: boolean;
  maxExecutionTimeMs: number;
}

export interface AssertionResult {
  assertionId: string;
  type: string;
  description?: string;
  passed: boolean;
  expected?: unknown;
  actual?: unknown;
  message: string;
}

export interface ExtractionResult {
  variableName: string;
  value: unknown;
  success: boolean;
  error?: string;
}

export interface StepResult {
  nodeId: string;
  label: string;
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  requestUrl?: string;
  requestMethod?: string;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBodyPreview?: string;
  responseSize?: number;
  assertionResults: AssertionResult[];
  extractionResults: ExtractionResult[];
  error?: string;
}

export interface ExecuteRequestInput {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

export interface ExecuteRequestResult {
  status: number;
  headers: Record<string, string>;
  body: string;
  bodyTruncated: boolean;
  durationMs: number;
  error?: string;
}

export interface VariableContext {
  [variableName: string]: unknown;
}

export interface WorkflowExecutionInput {
  workflowId: string;
  variables?: VariableContext;
}
