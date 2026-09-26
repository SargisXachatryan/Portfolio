import './styles/GalleryControls.css'

interface Props {
  subtitles: string[]
  activeSubtitle: string
  query: string
  onSubtitleChange: (subtitle: string) => void
  onQueryChange: (q: string) => void
}

export default function GalleryControls({
  subtitles, activeSubtitle, query, onSubtitleChange, onQueryChange,
}: Props) {
  return (
    <div className="controls">
      <div className="filters">
        {subtitles.map((subtitle) => (
          <button
            key={subtitle}
            className={`filter-btn ${activeSubtitle === subtitle ? 'active' : ''}`}
            onClick={() => onSubtitleChange(subtitle)}
          >
            {subtitle}
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