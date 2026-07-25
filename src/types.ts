/**
 * Mirrors the Laravel side: `nodes`, `triggers` and `automations` tables, plus the
 * in-memory shapes produced by AutomationTreeBuildingHelper.
 */

export type NodeType = 'trigger' | 'action' | 'fork' | 'exit'

export type RelationshipType = 'child' | 'left-child' | 'right-child'

/** A row of the `nodes` table. */
export interface WorkflowNode {
  id: string
  title: string
  relationship_type: RelationshipType
  level: number
  type: 'action' | 'fork'
  full: boolean
  specific_type: string
  params: NodeParams
  automation_id: number
  is_valid: boolean
  parent_id: string | null
}

export interface NodeParams {
  delay_value?: number
  delay_unit?: string
  [key: string]: unknown
}

/** A row of the `triggers` table. */
export interface WorkflowTrigger {
  id: string
  automation_id: number
  condition_type: string
  trigger_type: string
  condition: unknown[]
}

/** A row of the `automations` table. */
export interface Automation {
  id: number
  uuid: string
  name: string
  is_active: boolean
  is_draft: boolean
  version: number
  is_valid: boolean
}

/** An entry of `/api/workflows.json`, listed on the landing page. */
export interface WorkflowSummary {
  id: number
  name: string
  description: string
  size: string
}

/** What `/api/automations/{id}.json` returns — the equivalent of `Automation::with('trigger')`. */
export interface AutomationPayload {
  automation: Automation
  trigger: WorkflowTrigger
  nodes: WorkflowNode[]
}

/**
 * A node once it has been pulled into the render tree. Exits are synthesised here
 * and never exist in the "database", so most persisted fields are optional.
 */
export interface TreeNode {
  id: string
  title: string
  type: NodeType
  relationship_type: RelationshipType
  level: number
  parent_id: string | null
  full: boolean
  specific_type?: string
  params?: NodeParams
  children: TreeNode[]
  width: number
  x: number
  y: number
}

/** A positioned node, flattened out of the tree, ready to render. */
export type PositionedElement = Omit<TreeNode, 'children'> & { key: string }

export type ConnectionType = 'child' | 'left' | 'right'

/** A link to draw between two elements, keyed by their DOM ids. */
export interface Connection {
  id: string
  emitter: string
  receiver: string
  color: string
  type: ConnectionType
}

/**
 * The full result of a layout pass. Coordinates are content-relative: the
 * bounding box of the cards starts at (0, 0) and is contentWidth x contentHeight,
 * leaving the canvas free to place and pad it however it likes.
 */
export interface Layout {
  elements: PositionedElement[]
  connections: Connection[]
  contentWidth: number
  contentHeight: number
  /**
   * x of the middle of the trigger card. The tree is rarely symmetrical around
   * it, so this — not the middle of the bounding box — is what the view centres
   * on: the workflow reads from its root outwards.
   */
  triggerCentreX: number
}

/** An entry of `/api/node-types.json` — the card picker catalogue. */
export interface NodeTypeOption {
  specific_type: string
  card_type: 'action' | 'fork'
  label: string
  description: string
  icon: string
  group: string
}

/** Identifies the "+" button that was clicked, i.e. where a new node goes. */
export interface InsertionPoint {
  emitter: string
  receiver: string
  relationship: ConnectionType
}
