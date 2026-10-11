import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Plus,
  Search,
  Copy,
  Trash2,
  ExternalLink,
  Layers,
  Calendar,
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useWorkflows } from '../hooks/useWorkflows';
import { Workflow } from '../types';

export const WorkflowList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    workflows,
    loading,
    deleteWorkflow,
    duplicateWorkflow,
  } = useWorkflows();

  const filtered = workflows.filter((w) =>
    (w.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id || deleteTarget.id;
    if (!id) return;
    setDeleting(true);
    await deleteWorkflow(id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleDuplicate = async (e: React.MouseEvent, w: Workflow) => {
    e.stopPropagation();
    const id = w._id || w.id;
    if (id) {
      await duplicateWorkflow(id);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Workflows"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/workflows/new')}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Workflow
          </Button>
        }
      />

      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-panel border border-border rounded-lg text-xs text-text-primary focus:border-yellow focus:outline-none"
            />
          </div>
          <div className="text-xs text-text-secondary">
            Showing <span className="font-semibold text-text-primary">{filtered.length}</span> workflows
          </div>
        </div>

        {/* Workflows Grid / List */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title={searchTerm ? 'No matching workflows' : 'No workflows found'}
            description={
              searchTerm
                ? 'Try tweaking your search term to find what you are looking for.'
                : 'Create your first workflow to orchestrate multi-step API calls with conditions and extractions.'
            }
            actionLabel="Create Workflow"
            onAction={() => navigate('/workflows/new')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((wf) => {
              const id = wf._id || wf.id || '';
              return (
                <div
                  key={id}
                  onClick={() => navigate(`/workflows/${id}/edit`)}
                  className="group bg-panel border border-border hover:border-yellow/50 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-text-primary group-hover:text-yellow transition-colors line-clamp-1">
                        {wf.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary-bg border border-border text-text-secondary flex items-center gap-1 shrink-0">
                        <Layers className="w-3 h-3" />
                        {wf.nodes?.length || 0}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary mt-2 line-clamp-2 min-h-[32px]">
                      {wf.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-secondary/70">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {wf.updatedAt
                          ? new Date(wf.updatedAt).toLocaleDateString()
                          : 'Draft'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDuplicate(e, wf)}
                        className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-secondary-bg rounded transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(wf);
                        }}
                        className="p-1.5 text-text-secondary hover:text-failure hover:bg-failure/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workflows/${id}/edit`);
                        }}
                        className="p-1.5 text-text-secondary hover:text-yellow hover:bg-secondary-bg rounded transition-colors"
                        title="Open Editor"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Workflow"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        isLoading={deleting}
      />
    </div>
  );
};
