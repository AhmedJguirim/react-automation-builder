/** The "..." dropdown shared by action and fork cards. */
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon'

interface CardMenuProps {
  editLabel: string
  onEdit: () => void
  onDelete: () => void
}

export function CardMenu({ editLabel, onEdit, onDelete }: CardMenuProps) {
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const close = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)

    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={container} className="absolute top-2 right-2 z-20">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Node options"
        >
          <Icon name="ellipsis-vertical" className="h-5 w-5" />
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-44 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onEdit()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Icon name="pencil-square" className="h-4 w-4 text-gray-400" />
              {editLabel}
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Icon name="trash" className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
