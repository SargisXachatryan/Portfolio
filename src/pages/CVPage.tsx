import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../styles/CVPage.css'

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
  const [width, setWidth] = useState(800)

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
            <p className="cv-viewer-status">Loading CV…</p>
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
              setNumPages(numPages)
              setStatus('ready')
            }}
            onLoadError={(err) => {
              console.error('CV preview failed to load:', err)
              setStatus('error')
            }}
            loading={null}
            error={null}
            className="cv-pdf-doc"
          >
            {Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i + 1}
                pageNumber={i + 1}
                width={width}
                devicePixelRatio={window.devicePixelRatio || 1}
                renderTextLayer={false}
                renderAnnotationLayer={true}
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