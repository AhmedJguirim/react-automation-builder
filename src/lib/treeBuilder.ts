/**
 * Port of app/Helpers/AutomationTreeBuildingHelper.php.
 *
 * Builds the in-memory tree used to render the workflow builder canvas. The
 * pipeline, in order, is:
 *  1. buildTreeDatastructure() links the trigger + nodes into a nested tree and
 *     synthesises "exit" leaves so every branch ends in something drawable.
 *  2. calculateWidths() figures out how much horizontal space each subtree needs.
 *  3. calculateXY() walks the tree top-down assigning pixel coordinates.
 *  4. adjustSpacing() nudges siblings apart when the width pass left them too
 *     close, then re-runs step 3 until a clean pass.
 *  5. flattenTree() + centerXY() turn the tree into a flat, positioned list.
 *
 * The pixel constants and the arithmetic in calculateWidths / calculateXY /
 * adjustSpacing / addWidthToCommonParent were hand-tuned on the PHP side to
 * avoid overlapping nodes for every shape of tree. They are kept identical here;
 * rely on adjustSpacing's dynamic correction rather than new hand-tuned offsets.
 */
import type {
  Connection,
  ConnectionType,
  Layout,
  PositionedElement,
  RelationshipType,
  TreeNode,
  WorkflowNode,
  WorkflowTrigger,
} from '../types'

/** Minimum horizontal gap enforced between two sibling subtrees. */
export const MINIMAL_SPACING = 330

/** Rendered width of an action/fork card, in pixels. */
export const NODE_SIZE = 320

/** Rendered width of an exit (dead-end) card, in pixels. */
export const EXIT_SIZE = 192

/** Vertical distance between two tree levels, in pixels. */
export const LEVEL_HEIGHT = 196

/** Top padding before the first (trigger) level, in pixels. */
export const TOP_OFFSET = 50

/** Rendered heights, needed here (unlike jsPlumb) to anchor the SVG connectors. */
export const NODE_HEIGHT = 66
export const EXIT_HEIGHT = 42

const COLORS: Record<ConnectionType, string> = {
  child: '#2b4cad',
  left: '#2e8228',
  right: '#b01a1a',
}

/** The DOM id an element is rendered with, e.g. `action-<uuid>`. */
export function elementId(node: { type: string; id: string }): string {
  return `${node.type}-${node.id}`
}

/** Splits `action-<uuid>` back into its node id, like getNodeFromElementId(). */
export function nodeIdFromElementId(elementIdentifier: string): string {
  const separator = elementIdentifier.indexOf('-')
  if (separator === -1) {
    throw new Error('Invalid element id format')
  }
  return elementIdentifier.slice(separator + 1)
}

export class AutomationTreeBuilder {
  /** Nodes for the current workflow, grouped by level (exits included). */
  private nodesByLevel: Record<number, TreeNode[]> = {}

  /** Flat list of positioned elements, produced by flattenTree(). */
  elements: PositionedElement[] = []

  /** Nested tree structure, rooted at the trigger. */
  tree: TreeNode[] = []

  /** Connection definitions (emitter/receiver/colour/type) to draw. */
  connections: Connection[] = []

  private trigger: TreeNode | null = null

  private maxWidth = 0

  /** Rightmost x reached by any element, used to size the canvas. */
  private mx = 0

  private readonly triggerRow: WorkflowTrigger

  private readonly nodeRows: WorkflowNode[]

  constructor(triggerRow: WorkflowTrigger, nodeRows: WorkflowNode[]) {
    this.triggerRow = triggerRow
    this.nodeRows = nodeRows
  }

  /** Runs the whole pipeline and returns everything the canvas needs. */
  static layout(trigger: WorkflowTrigger, nodes: WorkflowNode[]): Layout {
    const builder = new AutomationTreeBuilder(trigger, nodes)
    builder.buildTreeDatastructure()
    builder.calculateWidths(builder.tree[0])
    builder.calculateXY(builder.tree[0], 0)
    builder.adjustSpacing()
    builder.flattenTree(builder.tree)
    builder.centerXY()

    return {
      elements: builder.elements,
      connections: builder.connections,
      maxWidth: builder.mx,
      maxHeight: (Object.keys(builder.nodesByLevel).length + 1) * LEVEL_HEIGHT,
      initX: builder.elements[0]?.x ?? 0,
    }
  }

  /**
   * Loads the trigger and nodes into a nested tree rooted at the trigger. When
   * `exits` is true, synthetic exit nodes terminate every open branch.
   */
  buildTreeDatastructure(exits = true): void {
    const tree: TreeNode[] = []
    const nodeMap = new Map<string, TreeNode>()

    const trigger: TreeNode = {
      id: this.triggerRow.id,
      title: 'Workflow starts here',
      type: 'trigger',
      relationship_type: 'child',
      level: 0,
      parent_id: null,
      full: false,
      children: [],
      width: 0,
      x: 0,
      y: 0,
    }
    nodeMap.set(trigger.id, trigger)
    this.trigger = trigger

    this.nodesByLevel = {}
    const sorted = [...this.nodeRows].sort((a, b) => a.level - b.level)
    for (const row of sorted) {
      const node: TreeNode = { ...row, children: [], width: 0, x: 0, y: 0 }
      nodeMap.set(node.id, node)
      this.pushToLevel(node)
    }

    // Build the tree structure
    for (const node of nodeMap.values()) {
      if (node.type === 'trigger') {
        tree.push(node)
      } else if (node.parent_id === null) {
        trigger.children.push(node)
        this.addTriggerConnection(node)
      } else {
        nodeMap.get(node.parent_id)?.children.push(node)
        this.addConnection(node)
      }
    }

    if (exits) {
      this.addExits(tree)
    }

    this.tree = tree
  }

  private pushToLevel(node: TreeNode): void {
    ;(this.nodesByLevel[node.level] ??= []).push(node)
  }

  /**
   * Builds a synthetic "exit" leaf under `parent`, used to terminate a branch
   * that has no real node after it.
   */
  private makeExitChild(parent: TreeNode, relationshipType: RelationshipType): TreeNode {
    return {
      id: crypto.randomUUID(),
      title: 'exit',
      type: 'exit',
      relationship_type: relationshipType,
      parent_id: parent.id,
      level: parent.level + 1,
      full: false,
      children: [],
      width: 0,
      x: 0,
      y: 0,
    }
  }

  /**
   * Walks the tree and appends exit nodes wherever a branch is missing children,
   * so every action/trigger has exactly one child and every fork exactly two.
   *
   *  - action/trigger with no children: gets one "child" exit.
   *  - fork with no children: gets both a "left-child" and a "right-child" exit.
   *  - fork with only one side filled: gets an exit on the missing side.
   *  - fork with both sides filled: marked `full` (no exits added).
   */
  addExits(tree: TreeNode[]): void {
    for (const node of tree) {
      if (node.type === 'fork') {
        if (node.children.length === 0) {
          const leftChild = this.makeExitChild(node, 'left-child')
          const rightChild = this.makeExitChild(node, 'right-child')
          node.children.push(leftChild, rightChild)
          this.pushToLevel(leftChild)
          this.pushToLevel(rightChild)
          this.addConnection(leftChild)
          this.addConnection(rightChild)
        } else if (
          node.children.length === 1 &&
          node.children[0].relationship_type === 'left-child'
        ) {
          const child = this.makeExitChild(node, 'right-child')
          node.children.push(child)
          this.pushToLevel(child)
          this.addConnection(child)
        } else if (
          node.children.length === 1 &&
          node.children[0].relationship_type === 'right-child'
        ) {
          const child = this.makeExitChild(node, 'left-child')
          node.children.unshift(child)
          this.pushToLevel(child)
          this.addConnection(child)
        } else {
          node.full = true
        }
      } else if (node.type === 'action' || node.type === 'trigger') {
        if (node.children.length === 0) {
          const child = this.makeExitChild(node, 'child')
          node.children.push(child)
          this.pushToLevel(child)
          if (node.type === 'trigger') {
            this.addTriggerConnection(child)
          } else {
            this.addConnection(child)
          }
        }
      } else {
        // exit nodes have no children to process
        return
      }
      this.addExits(node.children)
    }
  }

  /**
   * Calculates the horizontal space each subtree needs, bottom-up.
   *
   *  - action/trigger: NODE_SIZE
   *  - exit: EXIT_SIZE
   *  - fork, both branches present: sum of children, floored at MINIMAL_SPACING
   *  - fork, one branch open: a fixed 532
   */
  calculateWidths(node: TreeNode): number {
    if (node.type === 'action' || node.type === 'trigger') {
      node.width = NODE_SIZE
      for (const child of node.children) {
        this.calculateWidths(child)
      }
    } else if (node.type === 'exit') {
      node.width = EXIT_SIZE
    } else if (node.type === 'fork') {
      if (node.full) {
        let width = 0
        for (const child of node.children) {
          width += this.calculateWidths(child)
        }
        node.width = width < MINIMAL_SPACING ? MINIMAL_SPACING : width
      } else {
        node.width = 532
        for (const child of node.children) {
          this.calculateWidths(child)
        }
      }
    }

    if (node.width > this.maxWidth) {
      this.maxWidth = node.width
    }

    return node.width
  }

  /**
   * Assigns pixel coordinates. `offset` is the x this node is centred around;
   * a fork's children are pushed left/right by half its calculated width.
   */
  calculateXY(node: TreeNode | undefined, offset: number): void {
    if (!node) {
      return
    }

    node.y = node.level * LEVEL_HEIGHT + TOP_OFFSET
    node.x = offset

    if (node.type === 'exit' && node.relationship_type === 'child') {
      node.x += (NODE_SIZE - EXIT_SIZE) / 2
    } else if (node.type === 'action' || node.type === 'trigger') {
      this.calculateXY(node.children[0], offset)
    } else if (node.type === 'fork') {
      // an "empty" fork (both children still exits) needs a tighter offset than
      // a fork with real content on at least one side
      const empty = node.children[0]?.type === 'exit' && node.children[1]?.type === 'exit'

      for (const child of node.children) {
        if (child.relationship_type === 'left-child') {
          // 140px is a hardcoded value to reduce the spacing error
          const leftOffset = empty ? offset - (node.width / 2 - 140) : offset - node.width / 2
          this.calculateXY(child, leftOffset)
        } else {
          this.calculateXY(child, offset + node.width / 2)
        }
      }
    }
  }

  /** True when `nodeId` is a fork whose both branches are already occupied. */
  private checkForkFull(nodeId: string): boolean {
    const node = this.findNodeInTree(nodeId, this.tree)

    return node?.type === 'fork' && node.full
  }

  /**
   * Fixpoint pass: walks levels bottom-up looking for non-sibling neighbours
   * closer together than MINIMAL_SPACING allows. When it finds one it grows
   * their common ancestor, recomputes coordinates, and starts over — until a
   * full pass finds nothing left to fix.
   */
  adjustSpacing(iteration = 0): void {
    if (this.tree.length === 0) {
      return
    }
    // The PHP version recurses unguarded; cap it so a pathological tree cannot
    // lock up the browser tab.
    if (iteration > 500) {
      console.warn('adjustSpacing: giving up after 500 passes')
      return
    }

    const levels: Record<number, TreeNode[]> = {}
    const collect = (node: TreeNode): void => {
      ;(levels[node.level] ??= []).push(node)
      for (const child of node.children) {
        collect(child)
      }
    }
    collect(this.tree[0])

    const depth = Math.max(...Object.keys(levels).map(Number))

    // Process each level, from the deepest up to the trigger
    for (let level = depth; level >= 0; level--) {
      const nodes = [...(levels[level] ?? [])].sort((a, b) => a.x - b.x)

      for (let i = 1; i < nodes.length; i++) {
        const previous = nodes[i - 1]
        const current = nodes[i]
        if (previous.parent_id === current.parent_id) {
          continue
        }

        const previousWidth = previous.type === 'exit' ? EXIT_SIZE : NODE_SIZE
        const requiredX = previous.x + previousWidth + MINIMAL_SPACING

        if (current.x < requiredX) {
          this.addWidthToCommonParent(previous.id, current.id, requiredX - current.x)
          this.calculateXY(this.tree[0], 0)
          this.adjustSpacing(iteration + 1)

          return
        }
      }
    }
  }

  /**
   * Walks both nodes' paths back to the root, finds their first common ancestor
   * and grows it by `additionalWidth` so the next calculateXY() pass pushes them
   * apart. Any full fork between that ancestor and `previousId` gets half of it,
   * since its own children's widths feed into its parent's.
   */
  private addWidthToCommonParent(
    previousId: string,
    currentId: string,
    additionalWidth: number,
  ): void {
    const previousPath = this.findPathToRoot(previousId)
    const currentPath = this.findPathToRoot(currentId)

    let commonParentId: string | null = null
    const parentFullNodeIds: string[] = []

    for (const nodeId of previousPath) {
      if (commonParentId === null && currentPath.includes(nodeId)) {
        commonParentId = nodeId
      } else if (commonParentId !== null && this.checkForkFull(nodeId)) {
        parentFullNodeIds.push(nodeId)
      }
    }

    if (commonParentId !== null) {
      this.addWidthToNode(commonParentId, additionalWidth)
    }

    for (const nodeId of parentFullNodeIds) {
      this.addWidthToNode(nodeId, additionalWidth / 2)
    }
  }

  /** Walks up parent_id references, returning every id passed through. */
  private findPathToRoot(nodeId: string): string[] {
    const path: string[] = []
    let current = this.findNodeById(nodeId)

    while (current) {
      path.push(current.id)
      current = current.parent_id ? this.findNodeById(current.parent_id) : null
    }

    return path
  }

  /** Looks a node up in the level-grouped list (the trigger is not in there). */
  private findNodeById(nodeId: string): TreeNode | null {
    for (const group of Object.values(this.nodesByLevel)) {
      const found = group.find((node) => node.id === nodeId)
      if (found) {
        return found
      }
    }

    return null
  }

  private addWidthToNode(nodeId: string, additionalWidth: number): void {
    const node = this.findNodeInTree(nodeId, this.tree)
    if (!node) {
      return
    }

    node.width += additionalWidth
    if (node.width > this.maxWidth) {
      this.maxWidth = node.width
    }
  }

  /** Registers a connection running from the trigger down to `node`. */
  private addTriggerConnection(node: TreeNode): void {
    this.connections.push({
      id: crypto.randomUUID(),
      emitter: `trigger-${this.trigger!.id}`,
      receiver: elementId(node),
      color: COLORS.child,
      type: 'child',
    })
  }

  /**
   * Registers a connection from `node`'s parent down to `node`, coloured and
   * typed according to its relationship_type.
   */
  private addConnection(node: TreeNode): void {
    const type: ConnectionType =
      node.relationship_type === 'left-child'
        ? 'left'
        : node.relationship_type === 'right-child'
          ? 'right'
          : 'child'

    const emitterType = type === 'child' ? 'action' : 'fork'

    this.connections.push({
      id: crypto.randomUUID(),
      emitter: `${emitterType}-${node.parent_id}`,
      receiver: elementId(node),
      color: COLORS[type],
      type,
    })
  }

  /** Flattens the tree depth-first into `elements`. */
  flattenTree(tree: TreeNode[]): void {
    for (const node of tree) {
      const { children, ...rest } = node
      this.elements.push({ ...rest, key: elementId(node) })
      if (children.length > 0) {
        this.flattenTree(children)
      }
    }
  }

  /**
   * Shifts every element so the tree sits centred with no negative coordinates,
   * tracking the rightmost edge reached (needed to size the scrollable canvas).
   */
  centerXY(): void {
    if (this.elements.length === 0) {
      return
    }

    let negativeOffset = 0
    for (const element of this.elements) {
      element.x = element.x + this.maxWidth / 2 + 500
      if (element.x < negativeOffset) {
        negativeOffset = element.x
      }
      if (element.x > this.maxWidth) {
        this.mx = element.x
      }
    }

    if (negativeOffset) {
      for (const element of this.elements) {
        element.x += -negativeOffset + 50
        if (element.x > this.maxWidth) {
          this.mx = element.x
        }
      }
    }
  }

  /** Depth-first search within the nested tree. */
  findNodeInTree(nodeId: string, tree: TreeNode[]): TreeNode | null {
    for (const node of tree) {
      if (node.id === nodeId) {
        return node
      }
      const found = this.findNodeInTree(nodeId, node.children)
      if (found) {
        return found
      }
    }

    return null
  }
}
