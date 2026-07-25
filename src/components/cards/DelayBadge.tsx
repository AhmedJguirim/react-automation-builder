/** The "After 2 days" pill that floats above a delayed card. */
import type { NodeParams } from '../../types'
import { Icon } from '../Icon'

export function DelayBadge({ params }: { params?: NodeParams }) {
  const value = params?.delay_value ?? 0
  if (!value) {
    return null
  }

  return (
    <div className="absolute -top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm">
      <Icon name="clock" className="h-3.5 w-3.5" />
      After {value} {params?.delay_unit}
    </div>
  )
}
