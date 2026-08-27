import Skeleton from '../Skeleton'
import './styles/FeaturedPanel.css'

/**
 * Reuses the real `.featured` and `.skeleton-thumb` sizing rules (see
 * FeaturedPanel.css / PortfolioPage.css) so the placeholder matches the
 * actual layout — including its responsive breakpoints — at every screen
 * size, with no jump once the real content mounts in.
 */
export default function PortfolioSkeleton() {
  return (
    <main className="portfolio-page" aria-hidden="true">
      {/* Stand-in for <FeaturedPanel> — reuses .featured's own responsive
          height so there's no size jump once the real panel mounts. */}
      <div className="featured" style={{ padding: 0 }}>
        <Skeleton style={{ position: 'absolute', inset: 0 }} />
      </div>

      <div className="gallery-lower">
        {/* Stand-in for <GalleryControls> — tag pills + search box */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Skeleton className="skeleton-line" style={{ width: 240, height: 36, borderRadius: 8 }} />
          <Skeleton className="skeleton-line" style={{ width: 64, height: 28, borderRadius: 99 }} />
          <Skeleton className="skeleton-line" style={{ width: 80, height: 28, borderRadius: 99 }} />
          <Skeleton className="skeleton-line" style={{ width: 72, height: 28, borderRadius: 99 }} />
        </div>

        {/* Stand-in for the <ProjectThumb> grid. Sized to fill its grid
            column with an aspect-ratio rather than a fixed 220x140 box, so
            it matches the responsive 2/3-column mobile layout as well as
            the fixed-width desktop row. */}
        <div className="thumbnails">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-thumb" />
          ))}
        </div>
      </div>
    </main>
  )
}