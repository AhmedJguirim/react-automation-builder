/**
 * The workflow builder canvas — the React counterpart of the Livewire page
 * component ⚡automation-builder.blade.php.
 *
 * The data comes from static JSON over fetch (see lib/api.ts) and lives in
 * component state; adding and deleting nodes rewrites that state through the
 * ported helpers in lib/mutations.ts, after which the tree is laid out again.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AddNodeModal } from './components/AddNodeModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Connectors } from './components/Connectors'
import { ZoomControls } from './components/ZoomControls'
import { ExitCard } from './components/cards/ExitCard'
import { ForkCard } from './components/cards/ForkCard'
import { NodeCard } from './components/cards/NodeCard'
import { TriggerCard } from './components/cards/TriggerCard'
import { usePanZoom } from './hooks/usePanZoom'
import { fetchAutomation, fetchNodeTypes } from './lib/api'
import { buildConnectorPaths, type ConnectorPath } from './lib/geometry'
import { addNode, deleteNode } from './lib/mutations'
import { AutomationTreeBuilder } from './lib/treeBuilder'
import type {
  Automation,
  Connection,
  InsertionPoint,
  Layout,
  NodeTypeOption,
  WorkflowNode,
  WorkflowTrigger,
} from './types'

const AUTOMATION_ID = 1

export default function App() {
  const [automation, setAutomation] = useState<Automation | null>(null)
  const [trigger, setTrigger] = useState<WorkflowTrigger | null>(null)
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [nodeTypes, setNodeTypes] = useState<NodeTypeOption[]>([])
  const [error, setError] = useState<string | null>(null)

  const [insertion, setInsertion] = useState<InsertionPoint | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WorkflowNode | null>(null)

  useEffect(() => {
    Promise.all([fetchAutomation(AUTOMATION_ID), fetchNodeTypes()])
      .then(([payload, types]) => {
        setAutomation(payload.automation)
        setTrigger(payload.trigger)
        setNodes(payload.nodes)
        setNodeTypes(types)
      })
      .catch((cause: Error) => setError(cause.message))
  }, [])

  // The whole layout pipeline, re-run whenever the "table" changes.
  const layout = useMemo(
    () => (trigger ? AutomationTreeBuilder.layout(trigger, nodes) : null),
    [trigger, nodes],
  )

  const connectorPaths = useMemo(
    () => (layout ? buildConnectorPaths(layout.connections, layout.elements) : []),
    [layout],
  )

  const onAddHere = useCallback((connection: Connection) => {
    setInsertion({
      emitter: connection.emitter,
      receiver: connection.receiver,
      relationship: connection.type,
    })
  }, [])

  const onPickNodeType = useCallback(
    (option: NodeTypeOption) => {
      if (!insertion || !trigger) {
        return
      }
      try {
        setNodes((current) => addNode(current, trigger, insertion, option))
      } catch (cause) {
        setError((cause as Error).message)
      }
      setInsertion(null)
    },
    [insertion, trigger],
  )

  const requestDelete = useCallback(
    (nodeId: string) => {
      setPendingDelete(nodes.find((node) => node.id === nodeId) ?? null)
    },
    [nodes],
  )

  const onConfirmDelete = useCallback(() => {
    if (!pendingDelete) {
      return
    }
    setNodes((current) => deleteNode(current, pendingDelete.id))
    setPendingDelete(null)
  }, [pendingDelete])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white">
      {error && (
        <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 shadow">
          {error}
        </div>
      )}

      {layout ? (
        <Canvas
          layout={layout}
          connectorPaths={connectorPaths}
          name={automation?.name ?? ''}
          onAddHere={onAddHere}
          onRequestDelete={requestDelete}
        />
      ) : (
        !error && (
          <div className="canvas-grid flex h-full items-center justify-center text-sm text-gray-400">
            Loading workflow…
          </div>
        )
      )}

      {insertion && nodeTypes.length > 0 && (
        <AddNodeModal
          options={nodeTypes}
          onSelect={onPickNodeType}
          onClose={() => setInsertion(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          variant={pendingDelete.specific_type}
          isFork={pendingDelete.type === 'fork'}
          onConfirm={onConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}

interface CanvasProps {
  layout: Layout
  connectorPaths: ConnectorPath[]
  name: string
  onAddHere: (connection: Connection) => void
  onRequestDelete: (nodeId: string) => void
}

/**
 * The pannable/zoomable surface: `#container` > `#viewport` > `#background` in
 * the Blade markup, collapsed here into a container plus one transformed layer.
 */
function Canvas({ layout, connectorPaths, name, onAddHere, onRequestDelete }: CanvasProps) {
  const panZoom = usePanZoom({
    maxWidth: layout.maxWidth,
    maxHeight: layout.maxHeight,
    initX: layout.initX,
  })

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute top-6 left-6 z-30 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur">
        {name}
      </div>

      <div
        className="canvas-grid absolute top-0 left-0"
        onMouseDown={panZoom.onMouseDown}
        style={{
          width: panZoom.canvasWidth,
          height: panZoom.canvasHeight,
          transform: `translate(${panZoom.translate.x}px, ${panZoom.translate.y}px) scale(${panZoom.scale})`,
          transformOrigin: '0 0',
          cursor: panZoom.isDragging ? 'grabbing' : 'grab',
        }}
      >
        <Connectors
          paths={connectorPaths}
          width={panZoom.canvasWidth}
          height={panZoom.canvasHeight}
          onAdd={onAddHere}
        />

        {layout.elements.map((element) => {
          switch (element.type) {
            case 'trigger':
              return <TriggerCard key={element.key} element={element} />
            case 'fork':
              return (
                <ForkCard
                  key={element.key}
                  element={element}
                  onDelete={() => onRequestDelete(element.id)}
                  onEdit={() => undefined}
                />
              )
            case 'action':
              return (
                <NodeCard
                  key={element.key}
                  element={element}
                  onDelete={() => onRequestDelete(element.id)}
                  onEdit={() => undefined}
                />
              )
            case 'exit':
              return <ExitCard key={element.key} element={element} />
            default:
              return null
          }
        })}
      </div>

      <ZoomControls
        scale={panZoom.scale}
        canZoomIn={panZoom.canZoomIn}
        canZoomOut={panZoom.canZoomOut}
        onZoomIn={panZoom.zoomIn}
        onZoomOut={panZoom.zoomOut}
        onReset={panZoom.resetView}
      />
    </div>
  )
}
