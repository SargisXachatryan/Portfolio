import type { CSSProperties } from 'react'
import './styles/Skeleton.css'

interface SkeletonProps {
  /** Extra class names — combine with layout classes so the block
   *  inherits width/height/position from the real element it stands in for. */
  className?: string
  style?: CSSProperties
}

/**
 * A single gray placeholder block with a shimmer animation.
 *
 * Usage pattern: drop this in place of real content, reusing the SAME
 * layout class as the real element (e.g. `.pp-main-image`) so the skeleton
 * automatically matches size/position — no separate skeleton CSS needed
 * for layout, only for the gray fill + shimmer.
 *
 *   <img className="pp-main-image" ... />
 *   →
 *   <Skeleton className="pp-main-image" />
 */
export default function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton-block ${className}`} style={style} aria-hidden="true" />
}
