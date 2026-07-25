/**
 * Draws the links between cards and hangs an "add node" button at the middle of
 * each one — the React equivalent of the jsPlumb connections plus their custom
 * overlay in resources/js/automation-builder.js.
 */
import type { ConnectorPath } from '../lib/geometry'
import type { Connection } from '../types'
import { Icon } from './Icon'

interface ConnectorsProps {
  paths: ConnectorPath[]
  width: number
  height: number
  onAdd: (connection: Connection) => void
}

export function Connectors({ paths, width, height, onAdd }: ConnectorsProps) {
  return (
    <>
      <svg
        className="pointer-events-none absolute top-0 left-0 z-0"
        width={width}
        height={height}
        aria-hidden="true"
      >
        {paths.map(({ connection, d }, index) => (
          <path
            key={connection.id}
            d={d}
            fill="none"
            stroke={connection.color}
            strokeWidth={2}
            className="connector-draw-in"
            style={{ animationDelay: `${index * 30}ms` }}
          />
        ))}
      </svg>

      {paths.map(({ connection, midpoint }) => (
        <button
          key={`add-${connection.id}`}
          type="button"
          onClick={() => onAdd(connection)}
          style={{ left: midpoint.x, top: midpoint.y }}
          className="add-connection-button absolute z-10 -translate-x-1/2 -translate-y-1/2 text-white"
          aria-label="Add a node here"
        >
          <Icon name="plus" className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ))}
    </>
  )
}
