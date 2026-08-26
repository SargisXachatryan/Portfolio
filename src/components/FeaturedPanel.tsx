import type { Project } from '../types'
import '../styles/FeaturedPanel.css'

interface Props {
  project: Project | null
  noResults?: boolean
}

export default function FeaturedPanel({ project, noResults }: Props) {
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
        <img
          key={project.id}
          src={project.image}
          alt={project.title}
          className="featured-image"
        />
        <div className="featured-overlay" />
      </div>

      {/* Year badge — solid, always readable */}
      <div className="featured-year-badge">
        <span>{project.year}</span>
        {project.tags.map((t) => (
          <span key={t} className="tag-pill">{t}</span>
        ))}
      </div>

      <div className="featured-body">
        <p className="featured-subtitle">{project.subtitle}</p>
        <h2 className="featured-title">{project.title}</h2>
        <p className="featured-desc">{project.description}</p>
        {project.link && (
          <a href={"/CV/portfolio/"+project.id} className="featured-cta">
            View Details <span className="arrow">→</span>
          </a>
        )}
      </div>
    </div>
  )
}