import type { Project } from '../../types'
import { DESC_IMG_TOKEN, resolveDescImage } from '../../utils/projectMedia'
import './styles/ProjectDetails.css'

interface ProjectDetailsProps {
  project: Project
  paragraphs: string[]
}

// Splits one paragraph of `details` on $$filename$$ tokens and returns a mix of
// <p> text blocks and standalone image blocks, so an embedded image is always
// its own element (never crammed inline with the surrounding sentence).
// NOTE: only ever called on `project.details` — the short `project.description`
// field is rendered elsewhere and is never scanned for $$...$$ tokens.
function renderDetailsParagraph(project: Project, para: string, paraIdx: number) {
  const parts = para.split(DESC_IMG_TOKEN) // even indices = plain text, odd indices = token
  return parts.map((part, i) => {
    const isImageToken = i % 2 === 1
    if (isImageToken) {
      const src = resolveDescImage(project, part)
      if (!src) return null
      return (
        <div key={`${paraIdx}-img-${i}`} className="pp-detail-image">
          <img src={src} alt="" className="pp-detail-image-img" loading="lazy" />
        </div>
      )
    }
    if (!part.trim()) return null
    return <p key={`${paraIdx}-txt-${i}`}>{part.trim()}</p>
  })
}

export default function ProjectDetails({ project, paragraphs }: ProjectDetailsProps) {
  if (paragraphs.length === 0) return null

  return (
    <section className="pp-desc-section">
      <img src={project.image} alt="" className="pp-desc-thumb" />
      <h2 className="pp-desc-heading">About the project</h2>
      <div className="pp-desc-body">
        {paragraphs.map((para, i) => renderDetailsParagraph(project, para, i))}
      </div>
    </section>
  )
}
