/** Port of ⚡fork.blade.php — a branching condition. */
import { NODE_HEIGHT } from '../../lib/treeBuilder'
import type { PositionedElement } from '../../types'
import { Icon } from '../Icon'
import { CardMenu } from './CardMenu'
import { DelayBadge } from './DelayBadge'

interface ForkCardProps {
  element: PositionedElement
  onDelete: () => void
  onEdit: () => void
}

export function ForkCard({ element, onDelete, onEdit }: ForkCardProps) {
  const isSplit = element.specific_type === 'a-b-testing'
  const icon = isSplit ? 'percent-badge' : 'arrows-right-left'
  const badge = isSplit ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'

  return (
    <div
      id={element.key}
      data-id={element.id}
      style={{ left: element.x, top: element.y, height: NODE_HEIGHT }}
      className="tree-element absolute w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
    >
      <DelayBadge params={element.params} />

      <div className="flex items-center gap-3 pr-6">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${badge}`}>
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium tracking-wide text-gray-400 uppercase">Condition</div>
          <div className="truncate text-sm font-medium text-gray-900">{element.title}</div>
        </div>
      </div>

      <CardMenu editLabel="Edit Rules" onEdit={onEdit} onDelete={onDelete} />

      {element.specific_type === 'if-else' && (
        <>
          <div className="absolute -bottom-4 left-8 z-30 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Yes
          </div>
          <div className="absolute -bottom-4 right-8 z-30 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
            No
          </div>
        </>
      )}

      {isSplit && (
        <>
          <div className="absolute -bottom-4 left-8 z-30 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            38%
          </div>
          <div className="absolute -bottom-4 right-8 z-30 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            62%
          </div>
        </>
      )}
    </div>
  )
}
