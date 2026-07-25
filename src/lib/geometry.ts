/**
 * Replaces jsPlumb: since the layout pass already knows every element's exact
 * position, the connectors can be drawn as plain SVG cubics.
 *
 * Anchors match the Blade/jsPlumb setup — `child` links leave the bottom centre
 * of the card, fork branches leave at 20% / 80% of its bottom edge, and every
 * link enters its target at the top centre.
 */
import type { Connection, PositionedElement } from '../types'
import { heightOf, widthOf } from './treeBuilder'

export interface Point {
  x: number
  y: number
}

export interface ConnectorPath {
  connection: Connection
  d: string
  /** Where the "+" overlay button sits (the curve's midpoint). */
  midpoint: Point
}

/** Where a link leaves its source card, per connection type. */
function sourceAnchor(element: PositionedElement, type: Connection['type']): Point {
  const ratio = type === 'left' ? 0.2 : type === 'right' ? 0.8 : 0.5

  return { x: element.x + widthOf(element) * ratio, y: element.y + heightOf(element) }
}

/** Where a link enters its target card: always the top centre. */
function targetAnchor(element: PositionedElement): Point {
  return { x: element.x + widthOf(element) / 2, y: element.y }
}

/** Point at t = 0.5 on a cubic Bézier. */
function midpointOf(p0: Point, c1: Point, c2: Point, p3: Point): Point {
  return {
    x: (p0.x + 3 * c1.x + 3 * c2.x + p3.x) / 8,
    y: (p0.y + 3 * c1.y + 3 * c2.y + p3.y) / 8,
  }
}

/**
 * Turns the layout's connection list into drawable paths, skipping any link
 * whose endpoints are missing (the JS side logged a warning for this too).
 */
export function buildConnectorPaths(
  connections: Connection[],
  elements: PositionedElement[],
): ConnectorPath[] {
  const byElementId = new Map(elements.map((element) => [element.key, element]))

  return connections.flatMap((connection) => {
    const source = byElementId.get(connection.emitter)
    const target = byElementId.get(connection.receiver)

    if (!source || !target) {
      console.warn(
        `Cannot draw connection, element(s) not found: ${connection.emitter} -> ${connection.receiver}`,
      )
      return []
    }

    const start = sourceAnchor(source, connection.type)
    const end = targetAnchor(target)

    // Curviness scales with the vertical gap, so a link stays smooth whether it
    // drops straight down or swings out to a branch.
    const curviness = Math.max(40, (end.y - start.y) * 0.45)
    const c1 = { x: start.x, y: start.y + curviness }
    const c2 = { x: end.x, y: end.y - curviness }

    return [
      {
        connection,
        d: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`,
        midpoint: midpointOf(start, c1, c2, end),
      },
    ]
  })
}
