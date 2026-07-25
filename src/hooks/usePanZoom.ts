/**
 * Sizes the canvas around the workflow and handles panning and zooming.
 *
 * The canvas is not an infinite Figma-style surface: it is exactly the
 * workflow's bounding box plus a fixed margin, equal on the left and right. The
 * dot grid is painted on the static container behind it, so the canvas never has
 * to be inflated to cover the screen.
 *
 * That makes panning behave the way a document does. When the padded workflow
 * fits on screen it is simply centred and cannot be dragged at all; when it
 * doesn't, panning stops with the canvas edge flush against the screen edge, so
 * the workflow can never be pushed out of view.
 */
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const ZOOM_LEVELS = [0.6, 0.8, 1, 1.2, 1.4]
const DEFAULT_ZOOM_INDEX = ZOOM_LEVELS.indexOf(1)
const STORAGE_KEY = 'scale'

/**
 * Breathing room around the workflow, in canvas pixels. The extra at the bottom
 * keeps the last row of cards clear of the floating zoom pill.
 */
const PADDING_X = 140
const PADDING_TOP = 100
const PADDING_BOTTOM = 140

interface PanZoomOptions {
  contentWidth: number
  contentHeight: number
  /** x of the middle of the trigger card, which the view centres on. */
  triggerCentreX: number
}

interface Point {
  x: number
  y: number
}

/** Tracks the window size so the canvas can be resized and re-clamped with it. */
function useViewportSize() {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)

    return () => window.removeEventListener('resize', onResize)
  }, [])

  return size
}

function storedZoomIndex(): number {
  const stored = Number.parseFloat(localStorage.getItem(STORAGE_KEY) ?? '')
  const index = ZOOM_LEVELS.indexOf(stored)

  return index === -1 ? DEFAULT_ZOOM_INDEX : index
}

export function usePanZoom({ contentWidth, contentHeight, triggerCentreX }: PanZoomOptions) {
  const [zoomIndex, setZoomIndex] = useState(storedZoomIndex)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOrigin = useRef({ x: 0, y: 0 })

  const scale = ZOOM_LEVELS[zoomIndex]
  const viewport = useViewportSize()

  // The workflow, its margin, and nothing else.
  const canvasWidth = contentWidth + PADDING_X * 2
  const canvasHeight = contentHeight + PADDING_TOP + PADDING_BOTTOM
  const contentOffsetX = PADDING_X
  const contentOffsetY = PADDING_TOP

  /**
   * The resting position: the trigger card in the middle of the screen, and the
   * workflow centred vertically. Used along whichever axis the workflow already
   * fits on — along the other, the user's pan wins.
   */
  const resting = useCallback(
    (atScale: number): Point => ({
      x: viewport.width / 2 - (contentOffsetX + triggerCentreX) * atScale,
      y: (viewport.height - contentHeight * atScale) / 2 - contentOffsetY * atScale,
    }),
    [viewport, contentOffsetX, contentOffsetY, triggerCentreX, contentHeight],
  )

  /**
   * Along each axis: when the workflow is bigger than the screen, keep the canvas
   * covering it so the workflow can't be dragged out of view. When it fits there
   * is nothing to pan, so it sits at the resting position — nudged back only if
   * centring the trigger would push a card off screen.
   */
  const clamp = useCallback(
    (next: Point, atScale: number): Point => {
      const axis = (
        value: number,
        canvasSize: number,
        offset: number,
        contentSize: number,
        viewportSize: number,
      ) => {
        if (canvasSize * atScale > viewportSize) {
          return Math.min(0, Math.max(viewportSize - canvasSize * atScale, value))
        }

        // Content flush with the left/top edge at one end, right/bottom at the other.
        const lowest = -offset * atScale
        const highest = viewportSize - (offset + contentSize) * atScale

        return Math.min(highest, Math.max(lowest, value))
      }

      const want = resting(atScale)
      const fitsX = canvasWidth * atScale <= viewport.width
      const fitsY = canvasHeight * atScale <= viewport.height

      return {
        x: axis(fitsX ? want.x : next.x, canvasWidth, contentOffsetX, contentWidth, viewport.width),
        y: axis(
          fitsY ? want.y : next.y,
          canvasHeight,
          contentOffsetY,
          contentHeight,
          viewport.height,
        ),
      }
    },
    [
      canvasWidth,
      canvasHeight,
      contentOffsetX,
      contentOffsetY,
      contentWidth,
      contentHeight,
      viewport,
      resting,
    ],
  )

  /**
   * The starting pan: the trigger centred horizontally, and the workflow hanging
   * from the top vertically so a long one opens at its root rather than its
   * middle.
   */
  const centredOn = useCallback(
    (atScale: number): Point => clamp({ ...resting(atScale), y: 0 }, atScale),
    [clamp, resting],
  )

  const centredOnRef = useRef(centredOn)
  centredOnRef.current = centredOn
  const scaleRef = useRef(scale)
  scaleRef.current = scale

  // Recentre when the workflow itself changes size — not on zoom or resize,
  // which keep whatever the user was looking at.
  useLayoutEffect(() => {
    setTranslate(centredOnRef.current(scaleRef.current))
  }, [contentWidth, contentHeight])

  // A resize changes the canvas size, so the current pan may now sit outside the
  // allowed range; pull it back inside.
  useLayoutEffect(() => {
    setTranslate((current) => clamp(current, scaleRef.current))
  }, [clamp])

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

      const centreX = viewport.width / 2
      const centreY = viewport.height / 2
      const fixedX = (centreX - translate.x) / scale
      const fixedY = (centreY - translate.y) / scale

      setZoomIndex(index)
      localStorage.setItem(STORAGE_KEY, String(nextScale))
      setTranslate(
        clamp({ x: centreX - fixedX * nextScale, y: centreY - fixedY * nextScale }, nextScale),
      )
    },
    [zoomIndex, translate, scale, clamp, viewport],
  )

  /** Largest zoom level at which the whole workflow is on screen, then centre it. */
  const fitToScreen = useCallback(() => {
    const fits = (candidate: number) =>
      canvasWidth * candidate <= viewport.width && canvasHeight * candidate <= viewport.height

    let index = ZOOM_LEVELS.findLastIndex(fits)
    if (index === -1) {
      index = 0
    }

    setZoomIndex(index)
    localStorage.setItem(STORAGE_KEY, String(ZOOM_LEVELS[index]))
    setTranslate(centredOn(ZOOM_LEVELS[index]))
  }, [canvasWidth, canvasHeight, viewport, centredOn])

  return {
    scale,
    translate,
    isDragging,
    canvasWidth,
    canvasHeight,
    contentOffsetX,
    contentOffsetY,
    onMouseDown,
    zoomIn: () => zoomTo(zoomIndex + 1),
    zoomOut: () => zoomTo(zoomIndex - 1),
    fitToScreen,
    canZoomIn: zoomIndex < ZOOM_LEVELS.length - 1,
    canZoomOut: zoomIndex > 0,
  }
}
