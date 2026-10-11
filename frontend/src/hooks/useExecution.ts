import { useState } from 'react';
import { executeWorkflow as apiExecuteWorkflow } from '../api/workflows';
import { executeRequest as apiExecuteRequest } from '../api/requests';
import { Execution, ExecuteRequestInput, ExecuteRequestResult } from '../types';
import toast from 'react-hot-toast';

export const useExecution = () => {
  const [executing, setExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<Execution | null>(null);
  const [requestResult, setRequestResult] = useState<ExecuteRequestResult | null>(null);

  const runWorkflow = async (workflowId: string, variables?: Record<string, unknown>) => {
    try {
      setExecuting(true);
      const execution = await apiExecuteWorkflow(workflowId, variables);
      setCurrentExecution(execution);
      if (execution.status === 'passed') {
        toast.success(`Workflow passed (${execution.passedSteps}/${execution.totalSteps} steps)`);
      } else {
        toast.error(`Workflow ${execution.status}: ${execution.failedSteps} failed step(s)`);
      }
      return execution;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Workflow execution failed';
      toast.error(msg);
      return null;
    } finally {
      setExecuting(false);
    }
  };

  const runRequest = async (input: ExecuteRequestInput) => {
    try {
      setExecuting(true);
      const result = await apiExecuteRequest(input);
      setRequestResult(result);
      if (result.status >= 200 && result.status < 400) {
        toast.success(`Status ${result.status} (${result.durationMs}ms)`);
      } else {
        toast.error(`Status ${result.status} (${result.durationMs}ms)`);
      }
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      toast.error(msg);
      return null;
    } finally {
      setExecuting(false);
    }
  };

  return {
    executing,
    currentExecution,
    requestResult,
    runWorkflow,
    runRequest,
    clearExecution: () => {
      setCurrentExecution(null);
      setRequestResult(null);
    },
  };
};
