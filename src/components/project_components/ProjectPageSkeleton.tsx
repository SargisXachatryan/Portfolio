import Skeleton from '../Skeleton'

/**
 * Shown in place of <ProjectPage>'s content while the project's hero image
 * hasn't finished loading yet. Reuses the real `.pp-*` layout classes so
 * every box lines up exactly where the real element will render — only the
 * fill (gray + shimmer, via <Skeleton>) differs from the final page.
 */
export default function ProjectPageSkeleton() {
  return (
    <main className="pp-root">
      <div className="pp-content">
        <div className="pp-back" style={{ opacity: 0.5 }}>
          <Skeleton className="skeleton-line" style={{ width: 90, height: 12 }} />
        </div>

        <div className="pp-top">
          {/* Viewer column */}
          <div className="pp-viewer-col">
            <Skeleton className="pp-main-display" />

            <div className="pp-strip-wrap">
              <div className="pp-strip">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="pp-strip-thumb" style={{ borderRadius: 4 }} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="pp-sidebar">
            <Skeleton className="skeleton-line" style={{ width: 100, height: 11 }} />
            <Skeleton className="skeleton-line" style={{ width: '85%', height: 40, marginTop: 10 }} />

            <div className="pp-sidebar-meta" style={{ marginTop: 14 }}>
              <Skeleton className="skeleton-line" style={{ width: 40, height: 12 }} />
              <div className="pp-tags">
                <Skeleton className="skeleton-line" style={{ width: 54, height: 22, borderRadius: 99 }} />
                <Skeleton className="skeleton-line" style={{ width: 68, height: 22, borderRadius: 99 }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              <Skeleton className="skeleton-line" style={{ width: '100%', height: 13 }} />
              <Skeleton className="skeleton-line" style={{ width: '100%', height: 13 }} />
              <Skeleton className="skeleton-line" style={{ width: '70%', height: 13 }} />
            </div>

            <Skeleton className="skeleton-line" style={{ width: 132, height: 38, borderRadius: 99, marginTop: 16 }} />
          </aside>
        </div>

        {/* Details section */}
        <section className="pp-desc-section">
          <Skeleton className="pp-desc-thumb" />
          <Skeleton className="skeleton-line" style={{ width: 220, height: 32, marginBottom: 20 }} />
          <div className="pp-desc-body">
            <Skeleton className="skeleton-line" style={{ width: '100%', height: 14 }} />
            <Skeleton className="skeleton-line" style={{ width: '100%', height: 14 }} />
            <Skeleton className="skeleton-line" style={{ width: '92%', height: 14 }} />
            <Skeleton className="skeleton-line" style={{ width: '60%', height: 14 }} />
          </div>
        </section>
      </div>
    </main>
  )
}
