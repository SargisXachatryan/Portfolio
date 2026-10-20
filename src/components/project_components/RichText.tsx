import type { ReactNode } from 'react'
import './styles/RichText.css'

/**
 * Tiny markdown-style renderer for the text you write in project data.
 * Supported (each on its own line):
 *
 *   ### Heading        → <h3>   (## also → h3, #### → h4)
 *   - item / * item    → bulleted list   (• also works)
 *   1. item / 1) item  → numbered list
 *   > quote            → blockquote
 *   plain lines        → paragraph; a single line break INSIDE a paragraph is kept (<br>)
 *   **bold**  *italic*  `code`   → inline
 *
 * A literal "\n" typed as two characters is treated as a real line break too.
 */

type Block =
  | { type: 'heading'; level: 3 | 4; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'quote'; lines: string[] }
  | { type: 'p'; lines: string[] }

const RE_HEADING = /^\s*(#{1,6})\s+(.*\S)\s*$/
const RE_UL = /^\s*(?:[-*]\s+|•\s*)(\S.*)$/
const RE_OL = /^\s*\d+[.):]\s+(\S.*)$/
const RE_QUOTE = /^\s*>\s?(.*)$/

export function parseBlocks(raw: string): Block[] {
  const lines = raw.replace(/\\n/g, '\n').replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let blank = true // true at the start and after any empty line

  const last = () => blocks[blocks.length - 1]

  for (const line of lines) {
    if (!line.trim()) { blank = true; continue }

    let m: RegExpMatchArray | null
    if ((m = line.match(RE_HEADING))) {
      blocks.push({ type: 'heading', level: m[1].length >= 4 ? 4 : 3, text: m[2] })
    } else if ((m = line.match(RE_UL))) {
      // Items stay in ONE list even when you separate them with blank lines
      const b = last()
      if (b?.type === 'ul') b.items.push(m[1])
      else blocks.push({ type: 'ul', items: [m[1]] })
    } else if ((m = line.match(RE_OL))) {
      const b = last()
      if (b?.type === 'ol') b.items.push(m[1])
      else blocks.push({ type: 'ol', items: [m[1]] })
    } else if ((m = line.match(RE_QUOTE))) {
      const b = last()
      if (b?.type === 'quote' && !blank) b.lines.push(m[1])
      else blocks.push({ type: 'quote', lines: [m[1]] })
    } else {
      const b = last()
      if (b?.type === 'p' && !blank) b.lines.push(line.trim()) // same paragraph: keep the line break
      else blocks.push({ type: 'p', lines: [line.trim()] })
    }
    blank = false
  }
  return blocks
}

// **bold**, *italic*, `code`
const RE_INLINE = /(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g

// [label](https://...)  → external link (new tab)
// [label](link:ID)      → link to another project, built by `resolveLink`
export type LinkResolver = (projectId: string) => string
const defaultResolveLink: LinkResolver = (id) => `/Portfolio/project/${id}`

function renderInline(text: string, keyBase: string, resolveLink: LinkResolver = defaultResolveLink): ReactNode[] {
  return text.split(RE_INLINE).filter(Boolean).map((part, i) => {
    const key = `${keyBase}-${i}`
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
    if (link) {
      const [, label, target] = link
      const internal = target.startsWith('link:')
      return (
        <a
          key={key}
          className="pp-rt-link"
          href={internal ? resolveLink(target.slice(5)) : target}
          {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        >{label}</a>
      )
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={key}>{part.slice(1, -1)}</code>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={key}>{part.slice(1, -1)}</em>
    return part
  })
}

function renderLines(lines: string[], keyBase: string, inline: (t: string, k: string) => ReactNode[]): ReactNode[] {
  return lines.flatMap((l, i) =>
    i === 0 ? inline(l, `${keyBase}-${i}`) : [<br key={`${keyBase}-br-${i}`} />, ...inline(l, `${keyBase}-${i}`)]
  )
}

interface RichTextProps {
  text: string
  /** Prefix so keys stay unique when several RichText blocks sit side by side */
  keyPrefix?: string
  className?: string
  /** Turns the id in [label](link:ID) into a URL. Default: /project/ID */
  resolveLink?: LinkResolver
}

export default function RichText({ text, keyPrefix = 'rt', className = '', resolveLink }: RichTextProps) {
  const blocks = parseBlocks(text)
  const inline = (t: string, k: string) => renderInline(t, k, resolveLink)
  return (
    <>
      {blocks.map((b, i) => {
        const key = `${keyPrefix}-${i}`
        switch (b.type) {
          case 'heading':
            return b.level === 3
              ? <h3 key={key} className="pp-rt-h3">{inline(b.text, key)}</h3>
              : <h4 key={key} className="pp-rt-h4">{inline(b.text, key)}</h4>
          case 'ul':
            return <ul key={key} className={`pp-rt-list ${className}`}>{b.items.map((it, j) => <li key={j}>{inline(it, `${key}-${j}`)}</li>)}</ul>
          case 'ol':
            return <ol key={key} className={`pp-rt-list pp-rt-list--ordered ${className}`}>{b.items.map((it, j) => <li key={j}>{inline(it, `${key}-${j}`)}</li>)}</ol>
          case 'quote':
            return <blockquote key={key} className="pp-rt-quote">{renderLines(b.lines, key, inline)}</blockquote>
          default:
            return <p key={key} className={className}>{renderLines(b.lines, key, inline)}</p>
        }
      })}
    </>
  )
}