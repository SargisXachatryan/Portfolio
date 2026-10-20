import type { Project } from '../../types'
import { DESC_IMG_TOKEN, resolveDescImage } from '../../utils/projectMedia'
import RichText from './RichText'
import './styles/ProjectDetails.css'

interface ProjectDetailsProps {
  project: Project
  paragraphs: string[]
  /** Maps the id in [label](link:ID) to a URL (default: /project/ID) */
  resolveLink?: (projectId: string) => string
}

// Joins all paragraphs back into one text, splits it on $$n$$ image tokens, and
// renders each text part with <RichText> (headings, lists, line breaks, links...).
// Parsing the text as a whole is what lets "• item" lines that were separated by
// blank lines end up in ONE list. Image tokens become standalone image blocks.
// NOTE: only ever called on `project.details` — the short `project.description`
// field is rendered elsewhere and is never scanned for $$...$$ tokens.
function renderDetails(project: Project, text: string, resolveLink?: (id: string) => string) {
  const parts = text.split(DESC_IMG_TOKEN) // even indices = plain text, odd indices = token
  return parts.map((part, i) => {
    const isImageToken = i % 2 === 1
    if (isImageToken) {
      const src = resolveDescImage(project, part)
      if (!src) return null
      return (
        <figure key={`img-${i}`} className="pp-detail-image">
          <img src={src} alt="" className="pp-detail-image-img" loading="lazy" />
        </figure>
      )
    }
    if (!part.trim()) return null
    return <RichText key={`txt-${i}`} keyPrefix={`t${i}`} text={part} resolveLink={resolveLink} />
  })
}

export default function ProjectDetails({ project, paragraphs, resolveLink }: ProjectDetailsProps) {
  if (paragraphs.length === 0) return null

  return (
    <section className="pp-desc-section">
      <img src={project.image} alt="" className="pp-desc-thumb" />
      <h2 className="pp-desc-heading">About the project</h2>
      <div className="pp-desc-body">
        {renderDetails(project, paragraphs.join('\n\n'), resolveLink)}
      </div>
    </section>
  )
}