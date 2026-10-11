import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { Workflow, RequestConfig } from '../types';

interface WorkflowState {
  currentWorkflow: Workflow | null;
  isDirty: boolean;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setSelectedNodeId: (id: string | null) => void;
  updateNodeConfig: (nodeId: string, config: Partial<RequestConfig>, label?: string) => void;
  addRequestNode: (nodeData?: Partial<RequestConfig>, position?: { x: number; y: number }) => string;
  removeNode: (nodeId: string) => void;
  markClean: () => void;
  markDirty: () => void;
}

const defaultRequestConfig: RequestConfig = {
  url: 'https://jsonplaceholder.typicode.com/todos/1',
  method: 'GET',
  queryParams: [],
  headers: [],
  body: '',
  timeoutMs: 10000,
  assertions: [
    {
      id: 'assert-status-1',
      type: 'status',
      operator: 'eq',
      expected: 200,
      description: 'Status is 200 OK',
    },
  ],
  extractionRules: [],
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  currentWorkflow: null,
  isDirty: false,
  nodes: [],
  edges: [],
  selectedNodeId: null,

  setCurrentWorkflow: (workflow) => {
    if (!workflow) {
      set({ currentWorkflow: null, nodes: [], edges: [], selectedNodeId: null, isDirty: false });
      return;
    }

    const flowNodes: Node[] = (workflow.nodes || []).map((node) => ({
      id: node.id,
      type: 'requestNode',
      position: node.position || { x: 100, y: 100 },
      data: {
        label: node.label || 'Request',
        config: node.config || defaultRequestConfig,
        status: 'pending',
      },
    }));

    const flowEdges: Edge[] = (workflow.edges || []).map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: { stroke: '#F5D90A', strokeWidth: 2 },
    }));

    set({
      currentWorkflow: workflow,
      nodes: flowNodes,
      edges: flowEdges,
      selectedNodeId: flowNodes[0]?.id || null,
      isDirty: false,
    });
  },

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true,
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  updateNodeConfig: (nodeId, configPartial, label) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id === nodeId) {
          const currentData = node.data as { label: string; config: RequestConfig; status?: string };
          return {
            ...node,
            data: {
              ...currentData,
              label: label !== undefined ? label : currentData.label,
              config: {
                ...currentData.config,
                ...configPartial,
              },
            },
          };
        }
        return node;
      });

      return {
        nodes: updatedNodes,
        isDirty: true,
      };
    });
  },

  addRequestNode: (nodeConfig = {}, position) => {
    const id = `node_${Date.now()}`;
    const state = get();
    const count = state.nodes.length + 1;
    const defaultPos = position || {
      x: 100 + ((count - 1) % 4) * 280,
      y: 100 + Math.floor((count - 1) / 4) * 160,
    };

    const newNode: Node = {
      id,
      type: 'requestNode',
      position: defaultPos,
      data: {
        label: `Step ${count}: ${nodeConfig.method || 'GET'}`,
        config: {
          ...defaultRequestConfig,
          ...nodeConfig,
        },
        status: 'pending',
      },
    };

    set({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
      isDirty: true,
    });

    return id;
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      isDirty: true,
    }));
  },

  markClean: () => set({ isDirty: false }),
  markDirty: () => set({ isDirty: true }),
}));
