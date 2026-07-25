/**
 * Port of the delete confirmation in ⚡automation-builder.blade.php. The Blade
 * version sets confirmationType to 'if/else' while its templates test for
 * 'if-else', so the body never renders there; here the branches key off the
 * node's actual specific_type.
 */
import { useEffect } from 'react'

interface ConfirmDialogProps {
  /** specific_type of the node being deleted, e.g. 'if-else'. */
  variant: string
  isFork: boolean
  onConfirm: () => void
  onCancel: () => void
}

function messageFor(variant: string, isFork: boolean): string {
  if (variant === 'if-else') {
    return 'Deleting this condition would permanently delete the nodes on the "no" or right side'
  }
  if (isFork) {
    return 'Deleting this condition would permanently delete the nodes on the right side'
  }

  return 'This action cannot be undone.'
}

export function ConfirmDialog({ variant, isFork, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onConfirm()
        }}
        className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold">Are you sure?</h2>
        <p className="mb-6 text-gray-600">{messageFor(variant, isFork)}</p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button type="submit" className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
