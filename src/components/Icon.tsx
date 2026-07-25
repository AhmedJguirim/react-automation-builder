/**
 * Stand-in for the Blade side's `<flux:icon>`: a small set of hand-drawn
 * 24x24 outline glyphs, so the canvas has no icon-font or SVG-sprite dependency.
 */
import type { SVGProps } from 'react'

const PATHS: Record<string, string[]> = {
  bolt: ['M13 2 4 14h6l-1 8 9-12h-6l1-8Z'],
  envelope: ['M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z', 'm3.5 7.5 8.5 6 8.5-6'],
  'chat-bubble': ['M20 12a8 8 0 0 1-8 8 8.7 8.7 0 0 1-3.3-.6L4 21l1.5-4.2A8 8 0 1 1 20 12Z'],
  tag: ['M3 3h7l11 11-7 7L3 10V3Z', 'M7.5 7.5h.01'],
  'user-minus': ['M12 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z', 'M5.5 20a6.5 6.5 0 0 1 13 0', 'M16.5 11H22'],
  'pencil-square': ['M16 4l4 4L9 19H5v-4L16 4Z', 'm13.5 6.5 4 4'],
  'arrow-up-tray': ['M12 16V4', 'm8 8 4-4 4 4', 'M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3'],
  'arrows-right-left': ['M4 8h14', 'm15 5 3 3-3 3', 'M20 16H6', 'm9 13-3 3 3 3'],
  'percent-badge': ['M18 6 6 18', 'M8.5 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z', 'M15.5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'],
  'shopping-cart': ['M3 4h2l2.6 11.2a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.5L21 8H6', 'M10 20.5h.01', 'M17 20.5h.01'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5.2l3 1.8'],
  'ellipsis-vertical': ['M12 6h.01', 'M12 12h.01', 'M12 18h.01'],
  trash: ['M4 7h16', 'M10 11v6M14 11v6', 'M6 7l.9 12.1A1 1 0 0 0 7.9 20h8.2a1 1 0 0 0 1-.9L18 7', 'M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2'],
  minus: ['M5 12h14'],
  plus: ['M12 5v14', 'M5 12h14'],
  'arrows-pointing-out': ['M9 4H4v5', 'M15 4h5v5', 'M15 20h5v-5', 'M9 20H4v-5'],
  exit: ['M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4', 'm14 8 4 4-4 4', 'M18 12H9'],
  'x-mark': ['m6 6 12 12', 'M18 6 6 18'],
  'arrow-left': ['M20 12H4', 'm9 7-5 5 5 5'],
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: string
}

export function Icon({ name, ...props }: IconProps) {
  const paths = PATHS[name] ?? PATHS.bolt

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
