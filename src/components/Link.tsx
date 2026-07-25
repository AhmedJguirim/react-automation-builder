/** An anchor that routes through the history API instead of reloading. */
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { useCallback } from 'react'
import { navigate } from '../lib/router'

interface LinkProps {
  to: string
  className?: string
  children: ReactNode
}

export function Link({ to, className, children }: LinkProps) {
  const onClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>) => {
      // Let the browser handle new-tab / new-window clicks.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
        return
      }
      event.preventDefault()
      navigate(to)
    },
    [to],
  )

  return (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  )
}
