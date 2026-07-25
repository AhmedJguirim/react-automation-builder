/** Port of ⚡node.blade.php — an action step. */
import { NODE_HEIGHT } from '../../lib/treeBuilder'
import type { PositionedElement } from '../../types'
import { Icon } from '../Icon'
import { CardMenu } from './CardMenu'
import { DelayBadge } from './DelayBadge'

const ICONS: Record<string, { icon: string; badge: string }> = {
  'import-csv': { icon: 'arrow-up-tray', badge: 'bg-blue-50 text-blue-600' },
  'send-mail': { icon: 'envelope', badge: 'bg-sky-50 text-sky-600' },
  'send-whatsapp': { icon: 'chat-bubble', badge: 'bg-green-50 text-green-600' },
  'add-tag': { icon: 'tag', badge: 'bg-violet-50 text-violet-600' },
  'remove-tag': { icon: 'tag', badge: 'bg-orange-50 text-orange-600' },
  'unsubscribe-contact': { icon: 'user-minus', badge: 'bg-rose-50 text-rose-600' },
  'update-contact': { icon: 'pencil-square', badge: 'bg-teal-50 text-teal-600' },
}

const FALLBACK = { icon: 'bolt', badge: 'bg-gray-100 text-gray-500' }

interface NodeCardProps {
  element: PositionedElement
  onDelete: () => void
  onEdit: () => void
}

export function NodeCard({ element, onDelete, onEdit }: NodeCardProps) {
  const { icon, badge } = ICONS[element.specific_type ?? ''] ?? FALLBACK

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
          <div className="text-xs font-medium tracking-wide text-gray-400 uppercase">Action</div>
          <div className="truncate text-sm font-medium text-gray-900">{element.title}</div>
        </div>
      </div>

      <CardMenu editLabel="Edit Node" onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}
