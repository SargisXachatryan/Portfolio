import { useEffect, useRef, useState } from 'react'
import type { Project } from '../../types'
import './styles/FeaturedPanel.css'

interface Props {
  project: Project | null
  noResults?: boolean
}

export default function FeaturedPanel({ project, noResults }: Props) {
  // Keep the previous project's image underneath while the new one fades in,
  // so carousel/hover changes crossfade instead of flashing through dark.
  const shownRef = useRef<Project | null>(project)
  const [outgoing, setOutgoing] = useState<Project | null>(null)

  useEffect(() => {
    if (!project) return
    const last = shownRef.current
    shownRef.current = project
    if (last && last.id !== project.id) {
      setOutgoing(last)
      const t = setTimeout(() => setOutgoing(null), 1200)
      return () => clearTimeout(t)
    }
  }, [project?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // When no results, show the last known project dimmed + overlay message
  if (noResults || !project) {
    return (
      <div className="featured featured--empty">
        {project && (
          <div className="featured-image-wrap">
            <img
              src={project.image}
              alt={project.title}
              className="featured-image featured-image--dimmed"
            />
            <div className="featured-overlay" />
          </div>
        )}
        <div className="featured-no-results">
          <span className="no-results-icon">⊘</span>
          <p>No projects match</p>
        </div>
      </div>
    )
  }

  return (
    <div className="featured">
      <div className="featured-image-wrap">
        {outgoing && (
          <img
            key={`out-${outgoing.id}`}
            src={outgoing.image}
            alt=""
            className="featured-image featured-image--outgoing"
          />
        )}
        <img
          key={project.id}
          src={project.image}
          alt={project.title}
          className="featured-image"
        />
        <div className="featured-overlay" />
      </div>

      {/* Year badge — solid, always readable */}
      <div className="featured-year-badge" key={`badge-${project.id}`}>
        <span>{project.year}</span>
        <div className="tag-pill-scroll">
          {project.tags.map((t) => (
            <span key={t} className="tag-pill">{t}</span>
          ))}
        </div>
      </div>

      <div className="featured-body" key={`body-${project.id}`}>
        <p className="featured-subtitle">{project.subtitle}</p>
        <h2 className="featured-title">{project.title}</h2>
        <p className="featured-desc">{project.description}</p>
        {project.link && (
          <a href={project.link} className="featured-cta">
            View Project <span className="arrow">→</span>
          </a>
        )}
      </div>
    </div>
  )
}