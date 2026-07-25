/** Port of ⚡trigger.blade.php — the root of every workflow. */
import { NODE_HEIGHT } from '../../lib/treeBuilder'
import type { PositionedElement } from '../../types'
import { Icon } from '../Icon'

export function TriggerCard({ element }: { element: PositionedElement }) {
  return (
    <div
      id={element.key}
      data-id={element.id}
      style={{ left: element.x, top: element.y, height: NODE_HEIGHT }}
      className="tree-element absolute w-80 rounded-xl border border-emerald-200 bg-white p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon name="bolt" className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium tracking-wide text-emerald-600 uppercase">
            Trigger
          </div>
          <div className="truncate text-sm font-medium text-gray-900">{element.title}</div>
        </div>
      </div>
    </div>
  )
}
