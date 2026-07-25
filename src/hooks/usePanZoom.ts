/**
 * Port of the `setup_canvas` half of resources/js/automation-builder.js: sizes
 * the canvas, centres it on the trigger, and handles drag-to-pan plus the
 * stepped zoom levels (persisted in localStorage, like the original).
 */
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NODE_SIZE } from '../lib/treeBuilder'

const ZOOM_LEVELS = [0.6, 0.8, 1, 1.2, 1.4]
const DEFAULT_ZOOM_INDEX = ZOOM_LEVELS.indexOf(1)
const STORAGE_KEY = 'scale'

interface PanZoomOptions {
  /** Rightmost x reached by the layout. */
  maxWidth: number
  maxHeight: number
  /** x of the trigger, which the viewport is centred on. */
  initX: number
}

function storedZoomIndex(): number {
  const stored = Number.parseFloat(localStorage.getItem(STORAGE_KEY) ?? '')
  const index = ZOOM_LEVELS.indexOf(stored)

  return index === -1 ? DEFAULT_ZOOM_INDEX : index
}

export function usePanZoom({ maxWidth, maxHeight, initX }: PanZoomOptions) {
  const [zoomIndex, setZoomIndex] = useState(storedZoomIndex)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOrigin = useRef({ x: 0, y: 0 })

  const scale = ZOOM_LEVELS[zoomIndex]
  const canvasWidth = maxWidth + window.innerWidth
  const canvasHeight = Math.max(maxHeight + 200, window.innerHeight + 100)

  const clamp = useCallback(
    (next: { x: number; y: number }, atScale: number) => ({
      x: Math.min(0, Math.max(-(canvasWidth * atScale - window.innerWidth), next.x)),
      y: Math.min(0, Math.max(-(canvasHeight * atScale - window.innerHeight), next.y)),
    }),
    [canvasWidth, canvasHeight],
  )

  /** Centres the viewport horizontally on the trigger card. */
  const centreOnTrigger = useCallback(
    (atScale: number) => {
      const screenCentre = window.innerWidth / 2
      const elementCentre = (initX + NODE_SIZE / 2) * atScale

      setTranslate({ x: screenCentre - elementCentre, y: 0 })
    },
    [initX],
  )

  // Re-centre whenever the layout shifts under us (a node was added or deleted),
  // without re-centring on every zoom step.
  const scaleRef = useRef(scale)
  scaleRef.current = scale

  useLayoutEffect(() => {
    centreOnTrigger(scaleRef.current)
  }, [centreOnTrigger])

  const onMouseDown = useCallback(
    (event: ReactMouseEvent) => {
      // Ignore drags that start on a button or inside a menu.
      if ((event.target as HTMLElement).closest('button')) {
        return
      }
      setIsDragging(true)
      dragOrigin.current = { x: event.clientX - translate.x, y: event.clientY - translate.y }
    },
    [translate],
  )

  useEffect(() => {
    if (!isDragging) {
      return
    }

    const onMouseMove = (event: MouseEvent) => {
      event.preventDefault()
      setTranslate(
        clamp(
          { x: event.clientX - dragOrigin.current.x, y: event.clientY - dragOrigin.current.y },
          scale,
        ),
      )
    }
    const onMouseUp = () => setIsDragging(false)

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging, clamp, scale])

  /** Steps the zoom while keeping the centre of the screen fixed. */
  const zoomTo = useCallback(
    (nextIndex: number) => {
      const index = Math.min(Math.max(nextIndex, 0), ZOOM_LEVELS.length - 1)
      if (index === zoomIndex) {
        return
      }
      const nextScale = ZOOM_LEVELS[index]

      const centreX = window.innerWidth / 2
      const centreY = window.innerHeight / 2
      const fixedX = (centreX - translate.x) / scale
      const fixedY = (centreY - translate.y) / scale

      setZoomIndex(index)
      localStorage.setItem(STORAGE_KEY, String(nextScale))
      setTranslate(
        clamp({ x: centreX - fixedX * nextScale, y: centreY - fixedY * nextScale }, nextScale),
      )
    },
    [zoomIndex, translate, scale, clamp],
  )

  const resetView = useCallback(() => {
    setZoomIndex(DEFAULT_ZOOM_INDEX)
    localStorage.setItem(STORAGE_KEY, String(ZOOM_LEVELS[DEFAULT_ZOOM_INDEX]))
    centreOnTrigger(ZOOM_LEVELS[DEFAULT_ZOOM_INDEX])
  }, [centreOnTrigger])

  return {
    scale,
    translate,
    isDragging,
    canvasWidth,
    canvasHeight,
    onMouseDown,
    zoomIn: () => zoomTo(zoomIndex + 1),
    zoomOut: () => zoomTo(zoomIndex - 1),
    resetView,
    canZoomIn: zoomIndex < ZOOM_LEVELS.length - 1,
    canZoomOut: zoomIndex > 0,
  }
}
