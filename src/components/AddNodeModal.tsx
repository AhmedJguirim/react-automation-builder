/**
 * The card picker opened by a "+" button on a connection. On the Laravel side
 * ⚡add-node-modal.blade.php is still an empty stub, so this is the missing half
 * of that flow rather than a port of it.
 */
import { useEffect } from 'react'
import type { NodeTypeOption } from '../types'
import { Icon } from './Icon'

interface AddNodeModalProps {
  options: NodeTypeOption[]
  onSelect: (option: NodeTypeOption) => void
  onClose: () => void
}

export function AddNodeModal({ options, onSelect, onClose }: AddNodeModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const groups = [...new Set(options.map((option) => option.group))]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add a step</h2>
            <p className="text-sm text-gray-500">
              Pick what happens at this point of the workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <Icon name="x-mark" className="h-5 w-5" />
          </button>
        </div>

        {groups.map((group) => (
          <div key={group} className="mb-6 last:mb-0">
            <div className="mb-2 text-xs font-medium tracking-wide text-gray-400 uppercase">
              {group}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {options
                .filter((option) => option.group === group)
                .map((option) => (
                  <button
                    key={option.specific_type}
                    type="button"
                    onClick={() => onSelect(option)}
                    className="action-select-card flex items-start gap-3 rounded-xl border border-gray-200 p-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <Icon name={option.icon} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
