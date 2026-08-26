import { Link } from 'react-router-dom'
import type { Project } from '../types'
import '../styles/ProjectThumb.css'

interface Props {
  project: Project
  isActive: boolean
  onSelect: (project: Project) => void
}

export default function ProjectThumb({ project, isActive, onSelect }: Props) {
  return (
    <Link
      to={`/Portfolio/project/${project.id}`}
      className={`thumb ${isActive ? 'active' : ''}`}
      onMouseEnter={() => onSelect(project)}
    >
      <img src={project.image} alt={project.title} className="thumb-img" />
      <div className="thumb-info">
        <span className="thumb-title">{project.title}</span>
        <span className="thumb-sub">{project.subtitle}</span>
      </div>
    </Link>
  )
}