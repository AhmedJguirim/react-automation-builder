/** Port of ⚡exit-node.blade.php — the synthetic dead-end of a branch. */
import { EXIT_HEIGHT } from '../../lib/treeBuilder'
import type { PositionedElement } from '../../types'
import { Icon } from '../Icon'

export function ExitCard({ element }: { element: PositionedElement }) {
  return (
    <div
      id={element.key}
      data-id={element.id}
      style={{ left: element.x, top: element.y, height: EXIT_HEIGHT }}
      className="tree-element absolute flex w-48 items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/60 px-3 py-2 text-gray-400"
    >
      <Icon name="exit" className="h-5 w-5 shrink-0" />
      <div className="text-sm font-medium">Exit</div>
    </div>
  )
}
