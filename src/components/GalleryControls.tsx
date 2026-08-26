import '../styles/GalleryControls.css'

interface Props {
  tags: string[]
  activeTag: string
  query: string
  onTagChange: (tag: string) => void
  onQueryChange: (q: string) => void
}

export default function GalleryControls({
  tags, activeTag, query, onTagChange, onQueryChange,
}: Props) {
  return (
    <div className="controls">
      <div className="filters">
        {tags.map((tag) => (
          <button
            key={tag}
            className={`filter-btn ${activeTag === tag ? 'active' : ''}`}
            onClick={() => onTagChange(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="search-wrap">
        <svg className="search-icon" viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          className="search"
          type="text"
          placeholder="Search projects…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
    </div>
  )
}
