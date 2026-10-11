import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, ExternalLink, Filter, CheckCircle2, XCircle } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Dialog } from '../components/ui/Dialog';
import { getExecutions, deleteExecution } from '../api/executions';
import { Execution } from '../types';
import toast from 'react-hot-toast';

export const ExecutionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Execution | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getExecutions({ limit: 50 });
      setExecutions(res.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch history';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id || deleteTarget.id;
    if (!id) return;
    try {
      setDeleting(true);
      await deleteExecution(id);
      setExecutions((prev) => prev.filter((e) => (e._id || e.id) !== id));
      toast.success('Execution deleted');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete execution';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = executions.filter((e) => {
    if (filterStatus === 'all') return true;
    return e.status === filterStatus;
  });

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Execution History" />

      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-secondary" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-panel border border-border rounded-lg text-xs text-text-primary px-3 py-1.5 focus:border-yellow focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
            </select>
          </div>

          <span className="text-xs text-text-secondary">
            Total records: <strong className="text-text-primary">{filtered.length}</strong>
          </span>
        </div>

        {/* History List */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No execution history"
            description="Run your workflows to record automated test results, duration, and response payloads."
            actionLabel="View Workflows"
            onAction={() => navigate('/workflows')}
          />
        ) : (
          <div className="bg-panel border border-border rounded-xl overflow-hidden divide-y divide-border">
            {filtered.map((item) => {
              const id = item._id || item.id || '';
              return (
                <div
                  key={id}
                  onClick={() => navigate(`/history/${id}`)}
                  className="p-4 flex items-center justify-between hover:bg-secondary-bg/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <StatusBadge status={item.status} />
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary group-hover:text-yellow transition-colors">
                        {item.workflowName || 'Workflow Execution'}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-text-secondary font-mono mt-0.5">
                        <span>
                          {item.startedAt
                            ? new Date(item.startedAt).toLocaleString()
                            : 'Unknown Date'}
                        </span>
                        <span>•</span>
                        <span>{item.durationMs || 0}ms</span>
                        <span>•</span>
                        <span>
                          {item.passedSteps || 0}/{item.totalSteps || 0} steps passed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      className="p-2 text-text-secondary hover:text-failure hover:bg-failure/10 rounded transition-colors"
                      title="Delete Run"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/history/${id}`);
                      }}
                      className="p-2 text-text-secondary hover:text-yellow hover:bg-secondary-bg rounded transition-colors"
                      title="View Report"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <Dialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Execution"
        description="Are you sure you want to delete this execution log?"
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        isLoading={deleting}
      />
    </div>
  );
};
