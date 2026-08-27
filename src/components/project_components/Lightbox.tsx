import { useEffect, useRef, useState } from 'react'
import './styles/Lightbox.css'

const ZOOM_MIN = 0.5
const ZOOM_MAX = 4

interface LightboxProps {
  /** Image to show. Render nothing when null. */
  src: string | null
  onClose: () => void
}

export default function Lightbox({ src, onClose }: LightboxProps) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; panX: number; panY: number; moved: boolean }>({
    dragging: false, startX: 0, startY: 0, panX: 0, panY: 0, moved: false
  })

  // Reset zoom/pan whenever the displayed image changes (new src, or reopened)
  useEffect(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [src])

  // Close on Escape; scroll wheel to zoom
  useEffect(() => {
    if (!src) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setScale((s) => {
        const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s - e.deltaY * 0.002))
        if (next <= 1) setPan({ x: 0, y: 0 })
        return next
      })
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
    }
  }, [src, onClose])

  if (!src) return null

  return (
    <div
      className="pp-lightbox-backdrop"
      onClick={() => {
        // Only close if the click wasn't a drag
        if (!dragState.current.moved) onClose()
      }}
    >
      <img
        src={src}
        alt=""
        className={`pp-lightbox-img ${scale > 1 ? 'pp-lightbox-img--zoomed' : ''}`}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-in',
          willChange: 'transform',
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          e.currentTarget.setPointerCapture(e.pointerId)
          dragState.current = {
            dragging: true,
            startX: e.clientX - pan.x,
            startY: e.clientY - pan.y,
            panX: pan.x,
            panY: pan.y,
            moved: false,
          }
          setIsDragging(true)
        }}
        onPointerMove={(e) => {
          if (!dragState.current.dragging) return
          const dx = e.clientX - dragState.current.startX
          const dy = e.clientY - dragState.current.startY
          if (Math.abs(dx - dragState.current.panX) > 3 || Math.abs(dy - dragState.current.panY) > 3) {
            dragState.current.moved = true
          }
          setPan({ x: dx, y: dy })
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          const wasMoved = dragState.current.moved
          dragState.current.dragging = false
          setIsDragging(false)
          if (!wasMoved) {
            const next = scale > 1 ? 1 : 2
            setScale(next)
            if (next === 1) setPan({ x: 0, y: 0 })
          }
          setTimeout(() => { dragState.current.moved = false }, 0)
        }}
      />
      <button
        className="pp-lightbox-close"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Close"
      >✕</button>
    </div>
  )
}
