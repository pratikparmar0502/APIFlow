import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Play,
  CheckCircle2,
  XCircle,
  Plus,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Spinner } from '../components/ui/Spinner';
import { getWorkflows, createWorkflow } from '../api/workflows';
import { getExecutions } from '../api/executions';
import { Workflow, Execution } from '../types';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [wfRes, exRes] = await Promise.all([
          getWorkflows({ limit: 5 }).catch(() => ({ items: [], total: 0 })),
          getExecutions({ limit: 5 }).catch(() => ({ items: [], total: 0 })),
        ]);
        if (mounted) {
          setWorkflows(wfRes.items || []);
          setExecutions(exRes.items || []);
        }
      } catch (err: unknown) {
        console.error('Dashboard load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const totalWorkflows = workflows.length;
  const totalExecutions = executions.length;
  const passedExecutions = executions.filter((e) => e.status === 'passed').length;
  const failedExecutions = executions.filter((e) => e.status === 'failed').length;

  const handleLoadDemo = async () => {
    try {
      setLoadingDemo(true);
      const demoWorkflow: Omit<Workflow, '_id' | 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Demo: User Authentication & Profile Flow',
        description: 'Chained workflow authenticating a demo user and querying protected profile',
        settings: {
          continueOnFailure: false,
          maxExecutionTimeMs: 30000,
        },
        nodes: [
          {
            id: 'node-1',
            type: 'request',
            label: '1. Get User Data',
            position: { x: 100, y: 120 },
            config: {
              url: 'https://jsonplaceholder.typicode.com/users/1',
              method: 'GET',
              queryParams: [],
              headers: [],
              assertions: [
                {
                  id: 'as-1',
                  type: 'status',
                  operator: 'eq',
                  expected: 200,
                  description: 'Response is 200 OK',
                },
                {
                  id: 'as-2',
                  type: 'jsonPath',
                  target: '$.username',
                  operator: 'eq',
                  expected: 'Bret',
                  description: 'Username matches Bret',
                },
              ],
              extractionRules: [
                {
                  id: 'ex-1',
                  variableName: 'userId',
                  source: 'responseJson',
                  jsonPath: '$.id',
                },
              ],
            },
          },
          {
            id: 'node-2',
            type: 'request',
            label: '2. Fetch User Posts',
            position: { x: 420, y: 120 },
            config: {
              url: 'https://jsonplaceholder.typicode.com/posts?userId={{userId}}',
              method: 'GET',
              queryParams: [],
              headers: [],
              assertions: [
                {
                  id: 'as-3',
                  type: 'status',
                  operator: 'eq',
                  expected: 200,
                  description: 'Posts returned successfully',
                },
              ],
              extractionRules: [],
            },
          },
        ],
        edges: [
          {
            id: 'edge-1-2',
            source: 'node-1',
            target: 'node-2',
          },
        ],
      };

      const created = await createWorkflow(demoWorkflow);
      toast.success('Demo workflow created!');
      const newId = created._id || created.id;
      if (newId) {
        navigate(`/workflows/${newId}/edit`);
      } else {
        navigate('/workflows');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create demo workflow';
      toast.error(msg);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Dashboard" />

      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-panel via-secondary-bg to-panel border border-border">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              Visual API Automation Platform
              <span className="text-yellow text-xs px-2 py-0.5 rounded-full bg-yellow/10 border border-yellow/20 font-mono">
                APIFlow v1.0
              </span>
            </h2>
            <p className="text-sm text-text-secondary max-w-xl">
              Design multi-step HTTP workflows, extract chained variables, assert response criteria, and monitor automated test runs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleLoadDemo}
              isLoading={loadingDemo}
              icon={<Sparkles className="w-4 h-4 text-yellow" />}
            >
              Load Demo Flow
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/workflows/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Workflow
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-panel border border-border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">Total Workflows</p>
              <h3 className="text-2xl font-bold text-text-primary mt-1">
                {loading ? '-' : totalWorkflows}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary-bg border border-border flex items-center justify-center text-yellow">
              <GitBranch className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 bg-panel border border-border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">Executions</p>
              <h3 className="text-2xl font-bold text-text-primary mt-1">
                {loading ? '-' : totalExecutions}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary-bg border border-border flex items-center justify-center text-text-secondary">
              <Play className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 bg-panel border border-border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">Passed Runs</p>
              <h3 className="text-2xl font-bold text-success mt-1">
                {loading ? '-' : passedExecutions}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 bg-panel border border-border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">Failed Runs</p>
              <h3 className="text-2xl font-bold text-failure mt-1">
                {loading ? '-' : failedExecutions}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-failure/10 border border-failure/20 flex items-center justify-center text-failure">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Content sections */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Workflows */}
            <div className="bg-panel border border-border rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-yellow" />
                  <h3 className="text-sm font-semibold text-text-primary">Recent Workflows</h3>
                </div>
                <button
                  onClick={() => navigate('/workflows')}
                  className="text-xs text-text-secondary hover:text-yellow flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {workflows.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-text-secondary space-y-3">
                  <p className="text-xs">No workflows created yet.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/workflows/new')}
                  >
                    Build your first workflow
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 flex-1">
                  {workflows.slice(0, 5).map((w) => {
                    const id = w._id || w.id || '';
                    return (
                      <div
                        key={id}
                        onClick={() => navigate(`/workflows/${id}/edit`)}
                        className="p-3 bg-secondary-bg hover:bg-border/40 border border-border/70 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <h4 className="text-xs font-semibold text-text-primary hover:text-yellow">
                            {w.name}
                          </h4>
                          <p className="text-[11px] text-text-secondary truncate max-w-xs mt-0.5">
                            {w.description || `${w.nodes?.length || 0} step(s)`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-text-secondary font-mono">
                            {w.nodes?.length || 0} nodes
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Executions */}
            <div className="bg-panel border border-border rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-yellow" />
                  <h3 className="text-sm font-semibold text-text-primary">Recent Executions</h3>
                </div>
                <button
                  onClick={() => navigate('/history')}
                  className="text-xs text-text-secondary hover:text-yellow flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {executions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-text-secondary space-y-3">
                  <p className="text-xs">No execution history found.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/tester')}
                    icon={<Zap className="w-3.5 h-3.5 text-yellow" />}
                  >
                    Test an API endpoint
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 flex-1">
                  {executions.slice(0, 5).map((ex) => {
                    const id = ex._id || ex.id || '';
                    return (
                      <div
                        key={id}
                        onClick={() => navigate(`/history/${id}`)}
                        className="p-3 bg-secondary-bg hover:bg-border/40 border border-border/70 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-primary">
                              {ex.workflowName || 'Workflow Run'}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-secondary font-mono mt-0.5 block">
                            {ex.startedAt ? new Date(ex.startedAt).toLocaleString() : 'Recent'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {ex.durationMs !== undefined && (
                            <span className="text-[10px] text-text-secondary font-mono">
                              {ex.durationMs}ms
                            </span>
                          )}
                          <StatusBadge status={ex.status} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
