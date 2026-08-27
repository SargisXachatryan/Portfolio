import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import Skeleton from '../components/Skeleton'
import './styles/CVPage.css'

const CV_URL = 'https://sargisXachatryan.github.io/Portfolio/resources/Sargis_Khachatryan_CV.pdf'

// Standard Vite/webpack5 way to point react-pdf at its bundled worker —
// no manual CDN <script> tags needed anymore.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function CVPage() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [numPages, setNumPages] = useState(0)
  // How many <Page> canvases have actually finished painting. `numPages` only
  // tells us the PDF was *parsed* — each page still has to rasterize onto its
  // canvas after that, and that's what was showing as a blank white box.
  const [renderedCount, setRenderedCount] = useState(0)
  const [width, setWidth] = useState(800)

  const allPagesRendered = numPages > 0 && renderedCount >= numPages

  // Reveal the moment every page has actually painted — not a moment before,
  // since that's the blank-canvas flash, and not a moment after either
  // (no fade, no delay: it's already fully drawn, so showing it is just a
  // plain, instant swap).
  useEffect(() => {
    if (allPagesRendered) setStatus('ready')
  }, [allPagesRendered])

  // Safety net: if a page's onRenderSuccess never fires for some reason,
  // don't leave the skeleton up forever.
  useEffect(() => {
    if (status !== 'loading') return
    const timer = setTimeout(() => setStatus((s) => (s === 'loading' ? 'ready' : s)), 8000)
    return () => clearTimeout(timer)
  }, [status])

  // Track the wrapper's actual rendered width so pages are drawn at full,
  // sharp resolution instead of being scaled up/down by the browser.
  // Debounced so browser-zoom / window-resize don't trigger a re-render
  // on every intermediate value.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (!w) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setWidth(Math.floor(w)), 120)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <main className="cv-page">
      <div className="cv-content">
        <div className="cv-viewer-wrap" ref={wrapRef}>
          {status === 'loading' && (
            // Page-shaped placeholders in roughly A4 proportions, standing in
            // for the eventual PDF pages — same wrapper, same width, so
            // nothing shifts position once the real pages mount in.
            <div className="cv-skeleton-stack" aria-hidden="true">
              <Skeleton className="cv-skeleton-page" />
              <Skeleton className="cv-skeleton-page cv-skeleton-page--peek" />
            </div>
          )}
          {status === 'error' && (
            <p className="cv-viewer-status">
              Couldn't load the preview.{' '}
              <a href={CV_URL} target="_blank" rel="noopener noreferrer">Open the PDF directly</a>.
            </p>
          )}
          <Document
            file={CV_URL}
            onLoadSuccess={({ numPages }) => {
              setRenderedCount(0)
              setNumPages(numPages)
            }}
            onLoadError={(err) => {
              console.error('CV preview failed to load:', err)
              setStatus('error')
            }}
            loading={null}
            error={null}
            // Pages still mount and paint while this is off-screen — canvas
            // rendering doesn't depend on visibility — so by the time this
            // switches into the normal flow, every page is already fully drawn.
            className={`cv-pdf-doc ${status === 'ready' ? 'is-visible' : 'is-rendering'}`}
          >
            {Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i + 1}
                pageNumber={i + 1}
                width={width}
                devicePixelRatio={window.devicePixelRatio || 1}
                renderTextLayer={false}
                renderAnnotationLayer={true}
                onRenderSuccess={() => setRenderedCount((c) => c + 1)}
                className="cv-pdf-page"
              />
            ))}
          </Document>
        </div>

        <a
          href={CV_URL}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="cv-download"
        >
          Download PDF <span className="cv-download-arrow">↓</span>
        </a>
      </div>
    </main>
  )
}