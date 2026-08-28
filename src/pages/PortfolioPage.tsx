import { useState, useMemo, useEffect } from 'react'
import projectsData from '../data/projects.json'
import type { Project, Tag } from '../types/index'
import FeaturedPanel from '../components/portfolio_components/FeaturedPanel'
import GalleryControls from '../components/portfolio_components/GalleryControls'
import ProjectThumb from '../components/portfolio_components/ProjectThumb'
import PortfolioSkeleton from '../components/portfolio_components/PortfolioSkeleton'
import './styles/PortfolioPage.css'

const PROJECTS = projectsData as Project[]
const ALL_TAGS: Tag[] = ['All' as Tag, ...Array.from(new Set(PROJECTS.flatMap((p) => p.tags))).sort()]

// How many thumbnail images to wait on before showing the real gallery —
// waiting on every project would delay the reveal on large portfolios for
// no visible benefit, since only the first screenful is visible anyway.
const PRELOAD_COUNT = 8

// Below this width the thumbnail grid switches to 2–3 columns (see
// PortfolioPage.css) and paginates with a "Load more" button — a fixed
// desktop-style grid on a narrow screen used to squeeze every card into a
// single column, which felt broken.
const PAGINATE_BREAKPOINT = '(max-width: 900px)'
const PAGE_SIZE = 6

export default function PortfolioPage() {
  const [activeTag, setActiveTag] = useState<Tag>('All' as Tag)
  const [query, setQuery] = useState('')
  const [featured, setFeatured] = useState<Project>(PROJECTS[0])
  const [galleryReady, setGalleryReady] = useState(false)
  const [isPaginated, setIsPaginated] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    const mq = window.matchMedia(PAGINATE_BREAKPOINT)
    const update = () => setIsPaginated(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Preload the featured image + the first page of thumbnails so the
  // skeleton is standing in for real network/decode time, not an
  // artificial delay.
  useEffect(() => {
    const toPreload = [PROJECTS[0]?.image, ...PROJECTS.slice(0, PRELOAD_COUNT).map((p) => p.image)]
      .filter((src): src is string => Boolean(src))

    if (toPreload.length === 0) {
      setGalleryReady(true)
      return
    }

    let cancelled = false
    let remaining = toPreload.length
    const settle = () => {
      remaining -= 1
      if (remaining <= 0 && !cancelled) setGalleryReady(true)
    }

    toPreload.forEach((src) => {
      const img = new Image()
      img.onload = settle
      img.onerror = settle
      img.src = src
      if (img.complete) settle()
    })

    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    return PROJECTS.filter((p) => {
      const matchesTag = activeTag === ('All' as Tag) || p.tags.includes(activeTag)
      const matchesQuery =
        query === '' ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      return matchesTag && matchesQuery
    })
  }, [activeTag, query])

  // Reset to the first page whenever the result set or breakpoint changes,
  // so it can't get stuck showing a stale partial list after a filter change.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeTag, query, isPaginated])

  const noResults = filtered.length === 0
  // Keep last known project as background when no results
  const safeFeatured = filtered.find((p) => p.id === featured.id) ?? filtered[0] ?? featured
  const displayed = isPaginated ? filtered.slice(0, visibleCount) : filtered
  const hasMore = isPaginated && visibleCount < filtered.length

  // Touch equivalent of onMouseEnter: as a finger drags across the
  // thumbnail row/grid, find whichever thumb is currently underneath it
  // and preview that project — same effect as hovering with a mouse. A
  // plain tap (no movement) never fires this, so normal Link navigation
  // on tap is untouched.
  const handleThumbTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    if (!touch) return
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const thumbEl = el?.closest<HTMLElement>('[data-project-id]')
    const id = thumbEl?.dataset.projectId
    if (!id) return
    const project = displayed.find((p) => String(p.id) === id)
    if (project && project.id !== safeFeatured?.id) setFeatured(project)
  }

  if (!galleryReady) {
    return <PortfolioSkeleton />
  }

  return (
    <main className="portfolio-page">
      <FeaturedPanel project={safeFeatured} noResults={noResults} />

      <div className="gallery-lower">
        <GalleryControls
          tags={ALL_TAGS}
          activeTag={activeTag}
          query={query}
          onTagChange={(tag: string) => setActiveTag(tag as Tag)}
          onQueryChange={setQuery}
        />

        <div className="thumbnails" onTouchMove={handleThumbTouchMove}>
          {!noResults && displayed.map((project) => (
            <ProjectThumb
              key={project.id}
              project={project}
              isActive={safeFeatured?.id === project.id}
              onSelect={setFeatured}
            />
          ))}
        </div>

        {hasMore && (
          <div className="load-more-wrap">
            <button
              type="button"
              className="load-more-btn"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              Load more
            </button>
          </div>
        )}
      </div>

      {/* ── Contact Section ── */}
      <section id="contact" className="contact-section">
        <div className="contact-inner">
          <div className="contact-header">
            <span className="contact-eyebrow">Get in touch</span>
            <h2 className="contact-title">Let's work together</h2>
          </div>

          <div className="contact-cards">
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=Sargis.a.xachatryan@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card"
            >
              <div className="contact-card-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="contact-card-text">
                <span className="contact-card-label">Email</span>
                <span className="contact-card-value">Sargis.a.xachatryan@gmail.com</span>
              </div>
              <span className="contact-card-arrow">→</span>
            </a>

            <a href="https://www.linkedin.com/in/sargis-xachatryan-009b102a5/" target="_blank" rel="noopener noreferrer" className="contact-card">
              <div className="contact-card-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 10v7M7 7v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M11 17v-4c0-1.5 1-2.5 2.5-2.5S16 11.5 16 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M11 10v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="contact-card-text">
                <span className="contact-card-label">LinkedIn</span>
                <span className="contact-card-value">Sargis Khachatryan</span>
              </div>
              <span className="contact-card-arrow">→</span>
            </a>

            <a href="https://github.com/SargisXachatryan" target="_blank" rel="noopener noreferrer" className="contact-card">
              <div className="contact-card-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="currentColor" />
                </svg>
              </div>
              <div className="contact-card-text">
                <span className="contact-card-label">GitHub</span>
                <span className="contact-card-value">SargisXachatryan</span>
              </div>
              <span className="contact-card-arrow">→</span>
            </a>

          </div>
        </div>
      </section>
    </main>
  )
}