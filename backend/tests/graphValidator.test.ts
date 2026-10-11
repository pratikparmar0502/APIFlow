import { describe, it, expect } from 'vitest';
import { validateWorkflowGraph } from '../src/utils/graphValidator';
import { WorkflowNode, WorkflowEdge } from '../src/types';

describe('Workflow Graph Validation', () => {
  const createNode = (id: string): WorkflowNode => ({
    id,
    type: 'request',
    label: `Node ${id}`,
    position: { x: 0, y: 0 },
    config: {
      url: 'https://example.com',
      method: 'GET',
      queryParams: [],
      headers: [],
      assertions: [],
      extractionRules: [],
    },
  });

  it('validates a single node with no edges', () => {
    const nodes = [createNode('node1')];
    const edges: WorkflowEdge[] = [];
    const result = validateWorkflowGraph(nodes, edges);
    expect(result.valid).toBe(true);
    expect(result.executionOrder).toEqual(['node1']);
  });

  it('validates a linear chain in correct topological order', () => {
    const nodes = [createNode('step1'), createNode('step2'), createNode('step3')];
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'step1', target: 'step2' },
      { id: 'e2', source: 'step2', target: 'step3' },
    ];
    const result = validateWorkflowGraph(nodes, edges);
    expect(result.valid).toBe(true);
    expect(result.executionOrder).toEqual(['step1', 'step2', 'step3']);
  });

  it('detects cycles', () => {
    const nodes = [createNode('a'), createNode('b')];
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'a' },
    ];
    const result = validateWorkflowGraph(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Cycle detected'))).toBe(true);
  });

  it('detects duplicate node IDs', () => {
    const nodes = [createNode('dup'), createNode('dup')];
    const edges: WorkflowEdge[] = [];
    const result = validateWorkflowGraph(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate node ID'))).toBe(true);
  });

  it('detects branching / multiple outgoing connections', () => {
    const nodes = [createNode('root'), createNode('b1'), createNode('b2')];
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'root', target: 'b1' },
      { id: 'e2', source: 'root', target: 'b2' },
    ];
    const result = validateWorkflowGraph(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('multiple outgoing connections'))).toBe(true);
  });

  it('detects non-existent node references in edges', () => {
    const nodes = [createNode('n1')];
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'n1', target: 'unknown' },
    ];
    const result = validateWorkflowGraph(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('non-existent target node'))).toBe(true);
  });
});
