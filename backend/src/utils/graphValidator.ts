import { WorkflowNode, WorkflowEdge } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  executionOrder: string[]; // node IDs in order
}

export function validateWorkflowGraph(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationResult {
  const errors: string[] = [];

  if (nodes.length === 0) {
    return { valid: false, errors: ['Workflow has no nodes'], executionOrder: [] };
  }

  // Check for duplicate node IDs
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  // Check edge references
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references non-existent target node: ${edge.target}`);
    }
    if (edge.source === edge.target) {
      errors.push(`Self-loop detected on node: ${edge.source}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, executionOrder: [] };
  }

  // Build adjacency for topological sort
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();

  for (const id of nodeIds) {
    inDegree.set(id, 0);
    outEdges.set(id, []);
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    outEdges.get(edge.source)!.push(edge.target);
  }

  // Check for nodes with multiple incoming edges (branching - not supported in v1)
  for (const [id, degree] of inDegree.entries()) {
    if (degree > 1) {
      errors.push(`Node "${id}" has multiple incoming connections. Only linear chains are supported.`);
    }
  }

  // Check for nodes with multiple outgoing edges
  for (const [id, targets] of outEdges.entries()) {
    if (targets.length > 1) {
      errors.push(`Node "${id}" has multiple outgoing connections. Only linear chains are supported.`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, executionOrder: [] };
  }

  // Find start nodes (no incoming edges)
  const initialStartNodes = [...inDegree.entries()]
    .filter(([, d]) => d === 0)
    .map(([id]) => id);

  // Check for disconnected nodes (if there are edges, all nodes must be reachable from a single start)
  if (edges.length > 0 && nodes.length > 1) {
    if (initialStartNodes.length > 1) {
      // Multiple disconnected chains - warn
      errors.push(
        `Workflow has ${initialStartNodes.length} disconnected chains. Connect all nodes in a single path.`
      );
      return { valid: false, errors, executionOrder: [] };
    }
  }

  // Topological sort (Kahn's algorithm)
  const tempInDegree = new Map(inDegree);
  const queue: string[] = [...initialStartNodes];
  const sorted: string[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    sorted.push(current);

    for (const neighbor of outEdges.get(current) || []) {
      const deg = (tempInDegree.get(neighbor) || 0) - 1;
      tempInDegree.set(neighbor, deg);
      if (deg === 0) queue.push(neighbor);
    }
  }

  // Cycle detection
  if (sorted.length !== nodes.length) {
    errors.push('Cycle detected in workflow graph. Cyclic execution is not supported.');
    return { valid: false, errors, executionOrder: [] };
  }

  return { valid: true, errors: [], executionOrder: sorted };
}
