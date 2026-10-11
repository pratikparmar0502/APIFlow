import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Play,
  Save,
  Plus,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { RequestNode } from '../components/workflow/RequestNode';
import { NodeConfigPanel } from '../components/workflow/NodeConfigPanel';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Spinner } from '../components/ui/Spinner';
import { JsonViewer } from '../components/ui/JsonViewer';
import { getWorkflow, createWorkflow, updateWorkflow, executeWorkflow } from '../api/workflows';
import { Workflow, WorkflowNode, WorkflowEdge, RequestConfig, Execution, StepResult } from '../types';
import toast from 'react-hot-toast';

const nodeTypes = {
  requestNode: RequestNode,
};

export const WorkflowBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<Execution | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStepResult, setSelectedStepResult] = useState<StepResult | null>(null);

  // Load workflow if existing
  useEffect(() => {
    if (isNew) {
      // Default starter node
      const initialNodeId = `node_${Date.now()}`;
      setNodes([
        {
          id: initialNodeId,
          type: 'requestNode',
          position: { x: 250, y: 150 },
          data: {
            label: 'Get Sample Post',
            config: {
              url: 'https://jsonplaceholder.typicode.com/posts/1',
              method: 'GET',
              queryParams: [],
              headers: [],
              assertions: [
                {
                  id: 'assert_status',
                  type: 'status',
                  operator: 'eq',
                  expected: 200,
                  description: 'Status is 200 OK',
                },
              ],
              extractionRules: [
                {
                  id: 'extract_user',
                  variableName: 'userId',
                  source: 'responseJson',
                  jsonPath: '$.userId',
                },
              ],
            },
            status: 'pending',
          },
        },
      ]);
      setSelectedNodeId(initialNodeId);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await getWorkflow(id);
        setWorkflowName(data.name || 'Untitled Workflow');
        setWorkflowDesc(data.description || '');

        const mappedNodes: Node[] = (data.nodes || []).map((n) => ({
          id: n.id,
          type: 'requestNode',
          position: n.position || { x: 200, y: 150 },
          data: {
            label: n.label,
            config: n.config,
            status: 'pending',
          },
        }));

        const mappedEdges: Edge[] = (data.edges || []).map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          animated: true,
          style: { stroke: '#F5D90A', strokeWidth: 2 },
        }));

        setNodes(mappedNodes);
        setEdges(mappedEdges);
        if (mappedNodes.length > 0) {
          setSelectedNodeId(mappedNodes[0].id);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load workflow';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isNew]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: '#F5D90A', strokeWidth: 2 },
          },
          eds
        )
      ),
    []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleAddNode = () => {
    const newId = `node_${Date.now()}`;
    const nextIndex = nodes.length + 1;
    const offset = (nodes.length % 5) * 40;

    const newNode: Node = {
      id: newId,
      type: 'requestNode',
      position: { x: 180 + offset, y: 140 + offset },
      data: {
        label: `Request ${nextIndex}`,
        config: {
          url: 'https://jsonplaceholder.typicode.com/todos/1',
          method: 'GET',
          queryParams: [],
          headers: [],
          assertions: [
            {
              id: `assert_${Date.now()}`,
              type: 'status',
              operator: 'eq',
              expected: 200,
              description: 'Status code is 200',
            },
          ],
          extractionRules: [],
        },
        status: 'pending',
      },
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
    toast.success('Step added to canvas');
  };

  const handleUpdateNodeConfig = (configPartial: Partial<RequestConfig>, newLabel?: string) => {
    if (!selectedNodeId) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          const prevData = node.data as { label: string; config: RequestConfig; status?: string };
          return {
            ...node,
            data: {
              ...prevData,
              label: newLabel !== undefined ? newLabel : prevData.label,
              config: {
                ...prevData.config,
                ...configPartial,
              },
            },
          };
        }
        return node;
      })
    );
  };

  const handleDeleteNode = (nodeIdToDelete: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeIdToDelete));
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeIdToDelete && e.target !== nodeIdToDelete)
    );
    if (selectedNodeId === nodeIdToDelete) {
      setSelectedNodeId(null);
    }
    toast.success('Step removed');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const workflowNodes: WorkflowNode[] = nodes.map((n) => ({
        id: n.id,
        type: 'request',
        label: (n.data as { label: string }).label || 'Request',
        position: n.position,
        config: (n.data as { config: RequestConfig }).config,
      }));

      const workflowEdges: WorkflowEdge[] = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      }));

      const payload = {
        name: workflowName || 'Untitled Workflow',
        description: workflowDesc,
        nodes: workflowNodes,
        edges: workflowEdges,
        settings: {
          continueOnFailure: false,
          maxExecutionTimeMs: 60000,
        },
      };

      if (isNew) {
        const created = await createWorkflow(payload);
        toast.success('Workflow saved');
        const newId = created._id || created.id;
        if (newId) {
          navigate(`/workflows/${newId}/edit`, { replace: true });
        }
        return created;
      } else {
        const updated = await updateWorkflow(id!, payload);
        toast.success('Workflow saved');
        return updated;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save workflow';
      toast.error(msg);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    // Save first to ensure latest graph state is on backend
    const saved = await handleSave();
    if (!saved) return;

    const currentId = saved._id || saved.id || id;
    if (!currentId) return;

    try {
      setRunning(true);
      setDrawerOpen(true);

      // Reset node status visual indicator
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...(n.data as object), status: 'running' },
        }))
      );

      const result = await executeWorkflow(currentId);
      setExecutionResult(result);
      if (result.stepResults && result.stepResults.length > 0) {
        setSelectedStepResult(result.stepResults[0]);
      }

      // Update node visual statuses based on execution steps
      setNodes((nds) =>
        nds.map((n) => {
          const stepMatch = result.stepResults?.find((s) => s.nodeId === n.id);
          return {
            ...n,
            data: {
              ...(n.data as object),
              status: stepMatch ? stepMatch.status : 'skipped',
            },
          };
        })
      );

      if (result.status === 'passed') {
        toast.success('Workflow completed successfully!');
      } else {
        toast.error(`Workflow ${result.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution failed';
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  return (
    <div className="flex flex-col h-full w-full bg-app-bg overflow-hidden relative">
      {/* Top Header Bar */}
      <div className="h-14 bg-secondary-bg border-b border-border px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={() => navigate('/workflows')}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-panel rounded transition-colors"
            title="Back to workflows"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full bg-transparent font-semibold text-sm text-text-primary focus:outline-none focus:border-b focus:border-yellow"
              placeholder="Workflow Name"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddNode}
            icon={<Plus className="w-3.5 h-3.5 text-yellow" />}
          >
            Add Step
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            isLoading={saving}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            Save
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRun}
            isLoading={running}
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Run
          </Button>
        </div>
      </div>

      {/* Main Builder Body: Palette / Canvas / NodeConfig */}
      <div className="flex-1 flex relative overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Visual React Flow Canvas */}
            <div className="flex-1 h-full w-full relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-app-bg"
              >
                <Background color="#2A2A30" gap={16} size={1} />
                <Controls />
                <MiniMap
                  nodeColor="#F5D90A"
                  maskColor="rgba(11, 11, 13, 0.7)"
                  style={{
                    backgroundColor: '#111114',
                    border: '1px solid #2A2A30',
                  }}
                />
              </ReactFlow>
            </div>

            {/* Config Panel for Selected Node */}
            {selectedNode && (
              <NodeConfigPanel
                nodeId={selectedNode.id}
                label={(selectedNode.data as { label: string }).label}
                config={(selectedNode.data as { config: RequestConfig }).config}
                onUpdate={handleUpdateNodeConfig}
                onClose={() => setSelectedNodeId(null)}
                onDeleteNode={() => handleDeleteNode(selectedNode.id)}
              />
            )}
          </>
        )}
      </div>

      {/* Bottom Drawer: Execution Results */}
      {drawerOpen && (
        <div className="absolute bottom-0 left-0 right-0 max-h-[50%] h-[380px] bg-panel border-t border-border z-30 flex flex-col shadow-2xl transition-all">
          <div className="h-10 bg-secondary-bg border-b border-border px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-text-primary">
                Execution Results
              </span>
              {executionResult && (
                <>
                  <StatusBadge status={executionResult.status} size="sm" />
                  <span className="text-[11px] font-mono text-text-secondary flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {executionResult.durationMs}ms
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-text-secondary hover:text-text-primary rounded"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Steps list */}
            <div className="w-64 border-r border-border overflow-y-auto p-2 space-y-1.5 bg-secondary-bg/30">
              {running ? (
                <div className="p-4 flex items-center gap-2 text-xs text-text-secondary">
                  <Spinner size="sm" />
                  Executing workflow steps...
                </div>
              ) : !executionResult ? (
                <div className="p-4 text-xs text-text-secondary">
                  Click &quot;Run&quot; to test your workflow.
                </div>
              ) : (
                executionResult.stepResults?.map((step, idx) => (
                  <div
                    key={step.nodeId || idx}
                    onClick={() => setSelectedStepResult(step)}
                    className={`p-2 rounded-lg cursor-pointer text-xs border transition-colors ${
                      selectedStepResult?.nodeId === step.nodeId
                        ? 'bg-panel border-yellow'
                        : 'bg-panel/40 border-border hover:border-text-secondary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-text-primary truncate">
                        {step.label}
                      </span>
                      <StatusBadge status={step.status} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-text-secondary font-mono">
                      <span>{step.responseStatus ? `${step.responseStatus}` : '-'}</span>
                      <span>{step.durationMs || 0}ms</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selected Step Detail */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedStepResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">
                        {selectedStepResult.label}
                      </h4>
                      <p className="text-xs font-mono text-text-secondary mt-0.5">
                        {selectedStepResult.requestMethod} {selectedStepResult.requestUrl}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-text-secondary">
                        Duration: {selectedStepResult.durationMs}ms
                      </span>
                      <StatusBadge status={selectedStepResult.status} />
                    </div>
                  </div>

                  {selectedStepResult.error && (
                    <div className="p-3 bg-failure/10 border border-failure/30 rounded-lg text-xs text-failure flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{selectedStepResult.error}</span>
                    </div>
                  )}

                  {/* Assertion results */}
                  {selectedStepResult.assertionResults && selectedStepResult.assertionResults.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Assertions ({selectedStepResult.assertionResults.length})
                      </span>
                      <div className="space-y-1.5">
                        {selectedStepResult.assertionResults.map((ar, i) => (
                          <div
                            key={ar.assertionId || i}
                            className={`p-2 rounded border text-xs flex items-center justify-between ${
                              ar.passed
                                ? 'bg-success/5 border-success/20 text-success'
                                : 'bg-failure/5 border-failure/20 text-failure'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {ar.passed ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5" />
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

                  {/* Response Body Preview */}
                  {selectedStepResult.responseBodyPreview && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Response Body
                      </span>
                      <JsonViewer data={selectedStepResult.responseBodyPreview} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-text-secondary py-8 text-center">
                  Select a step to inspect assertions and raw output.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
