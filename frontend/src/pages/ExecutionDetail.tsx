import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Spinner } from '../components/ui/Spinner';
import { JsonViewer } from '../components/ui/JsonViewer';
import { getExecution } from '../api/executions';
import { Execution, StepResult } from '../types';
import toast from 'react-hot-toast';

export const ExecutionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    const fetchRun = async () => {
      try {
        setLoading(true);
        const data = await getExecution(id);
        setExecution(data);
        // expand first step by default
        if (data.stepResults && data.stepResults.length > 0) {
          setExpandedSteps({ [data.stepResults[0].nodeId]: true });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch execution detail';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchRun();
  }, [id]);

  const toggleExpand = (nodeId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Execution Report"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/history')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to History
          </Button>
        }
      />

      <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        {loading ? (
          <div className="py-24 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : !execution ? (
          <div className="text-center py-16 text-text-secondary">
            Execution not found.
          </div>
        ) : (
          <>
            {/* Header Card */}
            <div className="p-6 bg-panel border border-border rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">
                    {execution.workflowName || 'Workflow Execution'}
                  </h2>
                  <p className="text-xs font-mono text-text-secondary mt-1">
                    ID: {execution._id || execution.id}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={execution.status} />
                  <span className="text-xs font-mono text-text-secondary bg-secondary-bg px-2.5 py-1 rounded border border-border flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {execution.durationMs || 0}ms
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border text-xs">
                <div>
                  <span className="text-text-secondary block">Total Steps</span>
                  <span className="font-semibold text-text-primary mt-0.5 block">
                    {execution.totalSteps}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block">Passed</span>
                  <span className="font-semibold text-success mt-0.5 block">
                    {execution.passedSteps}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block">Failed</span>
                  <span className="font-semibold text-failure mt-0.5 block">
                    {execution.failedSteps}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block">Executed At</span>
                  <span className="font-semibold text-text-primary mt-0.5 block">
                    {execution.startedAt ? new Date(execution.startedAt).toLocaleString() : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step Results List */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-yellow" />
                Step Executions ({execution.stepResults?.length || 0})
              </h3>

              <div className="space-y-3">
                {execution.stepResults?.map((step: StepResult, index: number) => {
                  const isExpanded = !!expandedSteps[step.nodeId];
                  return (
                    <div
                      key={step.nodeId || index}
                      className="bg-panel border border-border rounded-xl overflow-hidden"
                    >
                      {/* Step Header Accordion */}
                      <div
                        onClick={() => toggleExpand(step.nodeId)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary-bg/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-text-secondary" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-text-secondary" />
                          )}
                          <div>
                            <span className="text-xs font-semibold text-text-primary">
                              {index + 1}. {step.label}
                            </span>
                            <span className="text-[11px] font-mono text-text-secondary ml-3">
                              {step.requestMethod} {step.requestUrl}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-text-secondary">
                            {step.durationMs || 0}ms
                          </span>
                          <StatusBadge status={step.status} size="sm" />
                        </div>
                      </div>

                      {/* Step Content Drawer */}
                      {isExpanded && (
                        <div className="p-4 border-t border-border bg-secondary-bg/20 space-y-4">
                          {step.error && (
                            <div className="p-3 bg-failure/10 border border-failure/30 rounded-lg text-xs text-failure flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{step.error}</span>
                            </div>
                          )}

                          {/* Assertions */}
                          {step.assertionResults && step.assertionResults.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-text-secondary uppercase">
                                Assertions
                              </span>
                              <div className="space-y-1.5">
                                {step.assertionResults.map((ar, i) => (
                                  <div
                                    key={ar.assertionId || i}
                                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                      ar.passed
                                        ? 'bg-success/5 border-success/20 text-success'
                                        : 'bg-failure/5 border-failure/20 text-failure'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {ar.passed ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                      ) : (
                                        <AlertCircle className="w-4 h-4" />
                                      )}
                                      <span>{ar.description || ar.message}</span>
                                    </div>
                                    <span className="font-mono text-[10px]">
                                      {ar.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Extractions */}
                          {step.extractionResults && step.extractionResults.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-text-secondary uppercase">
                                Extracted Variables
                              </span>
                              <div className="p-3 bg-secondary-bg border border-border rounded-lg space-y-1 text-xs font-mono">
                                {step.extractionResults.map((ex, i) => (
                                  <div key={i} className="flex items-center justify-between">
                                    <span className="text-yellow">${ex.variableName}</span>
                                    <span className="text-text-primary">
                                      {JSON.stringify(ex.value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Response Payload */}
                          {step.responseBodyPreview && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-text-secondary uppercase">
                                Response Body
                              </span>
                              <JsonViewer data={step.responseBodyPreview} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
