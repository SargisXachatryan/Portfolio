import type { CSSProperties } from 'react'
import './styles/Icon.css'

/**
 * Google Fonts "Material Symbols" icon, loaded as an SVG by URL (no files
 * in your project, no icon font). Browse names at https://fonts.google.com/icons
 *
 *   <Icon name="chevron_left" size={28} />
 *   <Icon name="close" />
 *   <Icon name="add" variant="outlined" filled />
 *
 * The SVG is used as a CSS mask, so it takes the surrounding text colour
 * (`color` / currentColor) and can be any size via the `size` prop.
 */
type IconVariant = 'outlined' | 'rounded' | 'sharp'

interface IconProps {
  /** Material Symbols icon name, e.g. "arrow_forward", "close", "add" */
  name: string
  /** px number or any CSS length. Defaults to 1em (inherits font-size). */
  size?: number | string
  variant?: IconVariant
  /** Use the filled version of the glyph */
  filled?: boolean
  className?: string
  style?: CSSProperties
}

const BASE = 'https://fonts.gstatic.com/s/i/short-term/release'

export function iconUrl(name: string, variant: IconVariant = 'rounded', filled = false) {
  return `${BASE}/materialsymbols${variant}/${name}/${filled ? 'fill1' : 'default'}/24px.svg`
}

export default function Icon({ name, size, variant = 'rounded', filled = false, className = '', style }: IconProps) {
  const css = {
    '--icon-url': `url("${iconUrl(name, variant, filled)}")`,
    ...(size !== undefined ? { '--icon-size': typeof size === 'number' ? `${size}px` : size } : {}),
    ...style,
  } as CSSProperties

  return <span className={`pp-icon ${className}`} style={css} aria-hidden="true" />
}
