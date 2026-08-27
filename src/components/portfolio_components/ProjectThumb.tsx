import { Link } from 'react-router-dom'
import type { Project } from '../../types'
import './styles/ProjectThumb.css'

interface Props {
  project: Project
  isActive: boolean
  onSelect: (project: Project) => void
}

// Only devices with a real hover-capable pointer (mouse/trackpad) get the
// hover-to-preview behavior. On touch devices `mouseenter` can fire on the
// first tap, which used to "eat" that tap and force a second tap to
// actually follow the link — this check removes that trap entirely rather
// than trying to patch around it.
const supportsHover =
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

export default function ProjectThumb({ project, isActive, onSelect }: Props) {
  return (
    <Link
      to={`/Portfolio/project/${project.id}`}
      className={`thumb ${isActive ? 'active' : ''}`}
      onMouseEnter={supportsHover ? () => onSelect(project) : undefined}
    >
      <img src={project.image} alt={project.title} className="thumb-img" />
      <div className="thumb-info">
        <span className="thumb-title">{project.title}</span>
        <span className="thumb-sub">{project.subtitle}</span>
      </div>
    </Link>
  )
}