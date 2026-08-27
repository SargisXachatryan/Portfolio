import type { Project } from '../../types'
import './styles/ProjectSidebar.css'

interface ProjectSidebarProps {
  project: Project
  activeIndex: number
  mediaCount: number
}

export default function ProjectSidebar({ project, activeIndex, mediaCount }: ProjectSidebarProps) {
  return (
    <aside className="pp-sidebar">
      <p className="pp-sidebar-subtitle">{project.subtitle}</p>
      <h1 className="pp-sidebar-title">{project.title}</h1>

      <div className="pp-sidebar-meta">
        <span className="pp-meta-year">{project.year}</span>
        <div className="pp-tags">
          {project.tags.map((t) => (
            <span key={t} className="pp-tag">{t}</span>
          ))}
        </div>
      </div>

      <p className="pp-sidebar-desc">
        {project.description.split('\n\n')[0]}
      </p>

      {project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="pp-cta"
        >
          View project <span className="pp-cta-arrow">→</span>
        </a>
      )}

      {/* Media counter */}
      {mediaCount > 1 && (
        <p className="pp-media-count">
          {activeIndex + 1} / {mediaCount}
        </p>
      )}
    </aside>
  )
}
