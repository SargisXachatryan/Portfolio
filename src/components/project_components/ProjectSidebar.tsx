import type { Project } from '../../types'
import Icon from './Icon'
import RichText from './RichText'
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

      <div className="pp-sidebar-desc">
        <RichText keyPrefix="sb" text={project.description.split('\n\n')[0]} />
      </div>

      {project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="pp-cta"
        >
          View project <Icon name="arrow_outward" size={18} className="pp-cta-arrow" />
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