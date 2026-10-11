import { Execution } from '../models/Execution';
import { Workflow } from '../models/Workflow';
import { validateWorkflowGraph } from '../utils/graphValidator';
import { interpolateVariables, extractJsonPath, validateVariableName } from '../utils/variables';
import { evaluateAssertions } from '../utils/assertions';
import { executeRequest, buildFinalUrl, buildHeaders, redactHeaders } from './requestExecutor';
import {
  StepResult, VariableContext, WorkflowStatus,
  ExtractionRule, ExtractionResult, WorkflowNode
} from '../types';
import { config } from '../config/env';

let activeExecutions = 0;

export async function executeWorkflow(
  workflowId: string,
  initialVariables: VariableContext = {}
): Promise<string> {
  if (activeExecutions >= config.maxConcurrentExecutions) {
    throw new Error('Maximum concurrent executions reached. Please try again later.');
  }

  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  // Validate graph
  const validation = validateWorkflowGraph(workflow.nodes, workflow.edges);
  if (!validation.valid) {
    throw new Error(`Invalid workflow: ${validation.errors.join('; ')}`);
  }

  // Create execution record
  const execution = new Execution({
    workflowId: workflow._id,
    workflowName: workflow.name,
    workflowSnapshot: {
      nodes: workflow.nodes,
      edges: workflow.edges,
    },
    status: 'running' as WorkflowStatus,
    startedAt: new Date(),
    stepResults: [],
    totalSteps: validation.executionOrder.length,
    passedSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
  });

  await execution.save();
  activeExecutions++;

  try {
    const nodeMap = new Map<string, WorkflowNode>();
    for (const node of workflow.nodes) {
      nodeMap.set(node.id, node);
    }

    const variables: VariableContext = { ...initialVariables };
    const stepResults: StepResult[] = [];
    let workflowFailed = false;
    const maxDuration = workflow.settings?.maxExecutionTimeMs || 120000;
    const executionStart = Date.now();

    for (const nodeId of validation.executionOrder) {
      // Check overall timeout
      if (Date.now() - executionStart > maxDuration) {
        // Mark remaining as skipped
        const remainingIdx = validation.executionOrder.indexOf(nodeId);
        for (const remainId of validation.executionOrder.slice(remainingIdx)) {
          const node = nodeMap.get(remainId);
          stepResults.push({
            nodeId: remainId,
            label: node?.label || remainId,
            status: 'skipped',
            assertionResults: [],
            extractionResults: [],
            error: 'Execution timeout reached',
          });
        }
        workflowFailed = true;
        break;
      }

      const node = nodeMap.get(nodeId);
      if (!node) {
        stepResults.push({
          nodeId,
          label: nodeId,
          status: 'failed',
          assertionResults: [],
          extractionResults: [],
          error: `Node ${nodeId} not found`,
        });
        workflowFailed = true;
        if (!workflow.settings?.continueOnFailure) break;
        continue;
      }

      if (workflowFailed && !workflow.settings?.continueOnFailure) {
        stepResults.push({
          nodeId,
          label: node.label,
          status: 'skipped',
          assertionResults: [],
          extractionResults: [],
        });
        continue;
      }

      // Execute this step
      const stepResult = await executeStep(node, variables);
      stepResults.push(stepResult);

      // Update variables with extractions
      for (const extraction of stepResult.extractionResults) {
        if (extraction.success) {
          variables[extraction.variableName] = extraction.value;
        }
      }

      if (stepResult.status === 'failed') {
        workflowFailed = true;
      }
    }

    // Calculate final stats
    const passedSteps = stepResults.filter(s => s.status === 'passed').length;
    const failedSteps = stepResults.filter(s => s.status === 'failed').length;
    const skippedSteps = stepResults.filter(s => s.status === 'skipped').length;
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - execution.startedAt.getTime();

    execution.status = workflowFailed ? 'failed' : 'passed';
    execution.completedAt = completedAt;
    execution.durationMs = durationMs;
    execution.stepResults = stepResults;
    execution.passedSteps = passedSteps;
    execution.failedSteps = failedSteps;
    execution.skippedSteps = skippedSteps;
    await execution.save();

    return execution._id.toString();
  } catch (err) {
    execution.status = 'failed';
    execution.completedAt = new Date();
    execution.durationMs = Date.now() - execution.startedAt.getTime();
    execution.error = err instanceof Error ? err.message : 'Unknown error';
    await execution.save();
    throw err;
  } finally {
    activeExecutions--;
  }
}

async function executeStep(
  node: WorkflowNode,
  variables: VariableContext
): Promise<StepResult> {
  const startedAt = new Date();
  const stepResult: StepResult = {
    nodeId: node.id,
    label: node.label,
    status: 'running',
    startedAt,
    assertionResults: [],
    extractionResults: [],
  };

  try {
    const cfg = node.config;

    // Interpolate URL
    const { result: interpolatedUrl, missingVars: urlMissing } = interpolateVariables(cfg.url, variables);
    if (urlMissing.length > 0) {
      stepResult.status = 'failed';
      stepResult.error = `Missing variables in URL: ${urlMissing.join(', ')}`;
      stepResult.completedAt = new Date();
      stepResult.durationMs = Date.now() - startedAt.getTime();
      return stepResult;
    }

    // Build final URL with query params
    const resolvedParams = (cfg.queryParams || []).map(p => ({
      ...p,
      value: interpolateVariables(p.value, variables).result,
      key: interpolateVariables(p.key, variables).result,
    }));
    const finalUrl = buildFinalUrl(interpolatedUrl, resolvedParams);

    // Build headers
    const resolvedHeaders = (cfg.headers || []).map(h => ({
      ...h,
      value: interpolateVariables(h.value, variables).result,
    }));
    const headerMap = buildHeaders(resolvedHeaders);

    // Interpolate body
    let resolvedBody: string | undefined;
    if (cfg.body) {
      const { result } = interpolateVariables(cfg.body, variables);
      resolvedBody = result;
    }

    stepResult.requestUrl = finalUrl;
    stepResult.requestMethod = cfg.method;

    // Execute request
    const response = await executeRequest({
      url: finalUrl,
      method: cfg.method,
      headers: headerMap,
      body: resolvedBody,
      timeoutMs: cfg.timeoutMs,
    });

    const completedAt = new Date();
    stepResult.completedAt = completedAt;
    stepResult.durationMs = response.durationMs;
    stepResult.responseStatus = response.status;
    stepResult.responseHeaders = redactHeaders(response.headers);
    stepResult.responseBodyPreview = response.body.slice(0, 2000);
    stepResult.responseSize = response.body.length;

    // Handle network error
    if (response.error && response.status === 0) {
      stepResult.status = 'failed';
      stepResult.error = response.error;
      return stepResult;
    }

    // Evaluate assertions
    const assertionResults = evaluateAssertions(cfg.assertions || [], response);
    stepResult.assertionResults = assertionResults;
    const assertionsFailed = assertionResults.some(a => !a.passed);

    // Extract variables (even on assertion failure, still attempt extraction)
    const extractionResults = extractVariables(cfg.extractionRules || [], response, stepResult.responseStatus || 0);
    stepResult.extractionResults = extractionResults;

    // Determine step status
    if (assertionsFailed) {
      stepResult.status = 'failed';
      const failedAssertions = assertionResults.filter(a => !a.passed).map(a => a.message);
      stepResult.error = `Assertions failed: ${failedAssertions.join('; ')}`;
    } else {
      stepResult.status = 'passed';
    }

    return stepResult;
  } catch (err) {
    stepResult.status = 'failed';
    stepResult.completedAt = new Date();
    stepResult.durationMs = Date.now() - startedAt.getTime();
    stepResult.error = err instanceof Error ? err.message : 'Unknown error';
    return stepResult;
  }
}

function extractVariables(
  rules: ExtractionRule[],
  response: { status: number; headers: Record<string, string>; body: string },
  _status: number
): ExtractionResult[] {
  return rules.map(rule => {
    if (!validateVariableName(rule.variableName)) {
      return { variableName: rule.variableName, value: undefined, success: false, error: 'Invalid variable name' };
    }

    try {
      switch (rule.source) {
        case 'responseStatus':
          return { variableName: rule.variableName, value: response.status, success: true };

        case 'responseHeader': {
          if (!rule.headerName) {
            return { variableName: rule.variableName, value: undefined, success: false, error: 'headerName is required' };
          }
          const headerValue = response.headers[rule.headerName.toLowerCase()];
          if (headerValue === undefined) {
            return { variableName: rule.variableName, value: undefined, success: false, error: `Header "${rule.headerName}" not found` };
          }
          return { variableName: rule.variableName, value: headerValue, success: true };
        }

        case 'responseJson': {
          if (!rule.jsonPath) {
            return { variableName: rule.variableName, value: undefined, success: false, error: 'jsonPath is required' };
          }
          let parsed: unknown;
          try {
            parsed = JSON.parse(response.body);
          } catch {
            return { variableName: rule.variableName, value: undefined, success: false, error: 'Response is not valid JSON' };
          }
          const { value, found } = extractJsonPath(parsed, rule.jsonPath);
          if (!found) {
            return { variableName: rule.variableName, value: undefined, success: false, error: `JSON path "${rule.jsonPath}" not found` };
          }
          return { variableName: rule.variableName, value, success: true };
        }

        default:
          return { variableName: rule.variableName, value: undefined, success: false, error: `Unknown source: ${rule.source}` };
      }
    } catch (err) {
      return {
        variableName: rule.variableName,
        value: undefined,
        success: false,
        error: err instanceof Error ? err.message : 'Extraction error',
      };
    }
  });
}
