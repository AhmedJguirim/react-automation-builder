/**
 * Port of the mutating half of AutomationTreeBuildingHelper (addNode /
 * deleteNode / deleteSubtree), rewritten against an in-memory array of nodes
 * instead of Eloquent. Every function is pure: it returns the next state of the
 * `nodes` "table" rather than editing the one it was given.
 */
import type {
  InsertionPoint,
  NodeTypeOption,
  RelationshipType,
  WorkflowNode,
  WorkflowTrigger,
} from '../types'
import { nodeIdFromElementId } from './treeBuilder'

/** Every node id in `nodeId`'s subtree, including `nodeId` itself. */
function subtreeIds(nodes: WorkflowNode[], nodeId: string): string[] {
  const ids = [nodeId]
  for (const child of nodes.filter((node) => node.parent_id === nodeId)) {
    ids.push(...subtreeIds(nodes, child.id))
  }

  return ids
}

function shiftLevels(nodes: WorkflowNode[], ids: string[], delta: number): WorkflowNode[] {
  return nodes.map((node) =>
    ids.includes(node.id) ? { ...node, level: node.level + delta } : node,
  )
}

const RELATIONSHIP_BY_CONNECTION: Record<InsertionPoint['relationship'], RelationshipType> = {
  child: 'child',
  left: 'left-child',
  right: 'right-child',
}

/**
 * Inserts a new node onto the connection that was clicked: it is created under
 * the emitter, the receiver is reparented onto it, and everything below the
 * receiver is pushed down one level.
 */
export function addNode(
  nodes: WorkflowNode[],
  trigger: WorkflowTrigger,
  insertion: InsertionPoint,
  option: NodeTypeOption,
): WorkflowNode[] {
  const receiverId = nodeIdFromElementId(insertion.receiver)
  const emitterId = nodeIdFromElementId(insertion.emitter)

  // A receiver that isn't in the table is a synthetic exit; same for an emitter
  // that turns out to be the trigger.
  const receiver = nodes.find((node) => node.id === receiverId) ?? null
  const emitter = nodes.find((node) => node.id === emitterId) ?? null

  let addingUnderTrigger = false
  if (receiver && !receiver.parent_id) {
    addingUnderTrigger = true
  } else if (!emitter) {
    if (emitterId !== trigger.id) {
      throw new Error('Invalid emitter or receiver node')
    }
    addingUnderTrigger = true
  }

  const newNode: WorkflowNode = {
    id: crypto.randomUUID(),
    title: option.label,
    relationship_type: RELATIONSHIP_BY_CONNECTION[insertion.relationship],
    level: addingUnderTrigger ? 1 : emitter!.level + 1,
    type: option.card_type,
    full: false,
    specific_type: option.specific_type,
    params: {},
    automation_id: trigger.automation_id,
    is_valid: false,
    parent_id: addingUnderTrigger ? null : emitter!.id,
  }

  let next = [...nodes, newNode]

  if (receiver) {
    next = next.map((node) =>
      node.id === receiver.id
        ? {
            ...node,
            parent_id: newNode.id,
            relationship_type: (option.card_type === 'fork'
              ? 'left-child'
              : 'child') as RelationshipType,
          }
        : node,
    )

    next = shiftLevels(next, subtreeIds(next, receiver.id), 1)
  }

  return next
}

/** Deletes `nodeId` and everything below it. */
export function deleteSubtree(nodes: WorkflowNode[], nodeId: string): WorkflowNode[] {
  const doomed = subtreeIds(nodes, nodeId)

  return nodes.filter((node) => !doomed.includes(node.id))
}

/**
 * Deletes a single node, reconnecting its child (or, for a fork, its left
 * branch — the right branch is destroyed) to whatever it was attached to, and
 * pulling everything below it back up one level.
 */
export function deleteNode(nodes: WorkflowNode[], nodeId: string): WorkflowNode[] {
  const node = nodes.find((candidate) => candidate.id === nodeId)
  if (!node) {
    throw new Error('Node not found')
  }

  let next = nodes

  // forks require deleting the right side tree
  if (node.type === 'fork') {
    const rightChild = next.find(
      (candidate) =>
        candidate.parent_id === node.id && candidate.relationship_type === 'right-child',
    )
    if (rightChild) {
      next = deleteSubtree(next, rightChild.id)
    }
  }

  next = shiftLevels(next, subtreeIds(next, node.id), -1)

  const child = next.find((candidate) => candidate.parent_id === node.id)
  if (child) {
    next = next.map((candidate) =>
      candidate.id === child.id
        ? {
            ...candidate,
            parent_id: node.parent_id,
            relationship_type: node.relationship_type,
          }
        : candidate,
    )
  }

  return next.filter((candidate) => candidate.id !== node.id)
}
