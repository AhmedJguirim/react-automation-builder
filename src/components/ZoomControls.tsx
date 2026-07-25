/** The floating zoom pill from ⚡automation-builder.blade.php. */
import { Icon } from './Icon'

interface ZoomControlsProps {
  scale: number
  canZoomIn: boolean
  canZoomOut: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

export function ZoomControls({
  scale,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  return (
    <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-gray-200 bg-white/90 p-1.5 text-gray-600 shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className="rounded-full p-2 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Zoom out"
      >
        <Icon name="minus" className="h-4 w-4" />
      </button>
      <span className="w-12 text-center text-xs font-medium tabular-nums select-none">
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className="rounded-full p-2 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Zoom in"
      >
        <Icon name="plus" className="h-4 w-4" />
      </button>
      <div className="mx-1 h-5 w-px bg-gray-200" />
      <button
        type="button"
        onClick={onReset}
        className="rounded-full p-2 hover:bg-gray-100 hover:text-gray-900"
        aria-label="Fit to screen"
      >
        <Icon name="arrows-pointing-out" className="h-4 w-4" />
      </button>
    </div>
  )
}
