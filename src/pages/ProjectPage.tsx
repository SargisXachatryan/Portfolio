import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import projectsData from '../data/projects.json'
import type { Project } from '../types'
import '../styles/ProjectPage.css'

const PROJECTS = projectsData as Project[]
const STRIP_PAGE_SIZE = 5

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url)
}

// ─── Media item type ──────────────────────────────────────────────────────────

type MediaItem =
  | { kind: 'video'; src: string; thumb: string; isYouTube: boolean }
  | { kind: 'image'; src: string }

function buildMedia(project: Project): MediaItem[] {
  const items: MediaItem[] = []

  if (project.video) {
    const youtube = isYouTube(project.video)
    items.push({
      kind: 'video',
      src: project.video,
      thumb: project.image,
      isYouTube: youtube,
    })
  }

  for (const img of project.gallery ?? []) {
    items.push({ kind: 'image', src: img })
  }

  if (items.length === 0) {
    items.push({ kind: 'image', src: project.image })
  }

  return items
}

// ─── Detail images ($$index$$ tokens inside `details` ONLY — never `description`) ──

// Matches $$...$$ : two literal dollar signs, some content, two literal dollar signs.
const DESC_IMG_TOKEN = /\$\$([^$]+)\$\$/g

function resolveDescImage(project: Project, token: string): string | undefined {
  const value = token.trim()

  // Primary usage: a numeric index into detailImages, e.g. $$0$$ for the first
  // image added in the generator, $$1$$ for the second, and so on.
  if (/^\d+$/.test(value)) {
    return project.detailImages?.[Number(value)]
  }

  // Also accept a direct link, in case the image lives somewhere else entirely
  if (/^https?:\/\//i.test(value)) return value

  // Fallback: treat it as a bare filename and match it against detailImages
  return project.detailImages?.find((url) => (url.split('/').pop() ?? '') === value)
}

// Splits one paragraph of `details` on $$filename$$ tokens and returns a mix of
// <p> text blocks and standalone image blocks, so an embedded image is always
// its own element (never crammed inline with the surrounding sentence).
// NOTE: only ever called on `project.details` — the short `project.description`
// field is rendered elsewhere and is never scanned for $$...$$ tokens.
function renderDetailsParagraph(project: Project, para: string, paraIdx: number) {
  const parts = para.split(DESC_IMG_TOKEN) // even indices = plain text, odd indices = token
  return parts.map((part, i) => {
    const isImageToken = i % 2 === 1
    if (isImageToken) {
      const src = resolveDescImage(project, part)
      if (!src) return null
      return (
        <div key={`${paraIdx}-img-${i}`} className="pp-detail-image">
          <img src={src} alt="" className="pp-detail-image-img" loading="lazy" />
        </div>
      )
    }
    if (!part.trim()) return null
    return <p key={`${paraIdx}-txt-${i}`}>{part.trim()}</p>
  })
}

// ─── Custom Video Player ──────────────────────────────────────────────────────

interface VideoPlayerProps {
  src: string
  poster: string
  isYouTube: boolean
  autoPlay?: boolean
  /** Called whenever play/pause state changes so parent can react */
  onPlayingChange?: (playing: boolean) => void
}

function VideoPlayer({ src, poster, isYouTube, autoPlay = false, onPlayingChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // For real-time drag on progress bar
  const isDragging = useRef(false)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)   // 0–1
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const setPlayingState = useCallback((val: boolean) => {
    setPlaying(val)
    onPlayingChange?.(val)
  }, [onPlayingChange])

  // Auto-play when src changes (thumbnail click)
  useEffect(() => {
    const v = videoRef.current
    if (!v || isYouTube) return
    v.load()
    if (autoPlay) {
      v.play().then(() => setPlayingState(true)).catch(() => {})
    } else {
      setPlayingState(false)
    }
  }, [src, autoPlay, isYouTube])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().then(() => setPlayingState(true)).catch(() => {})
    } else {
      v.pause()
      setPlayingState(false)
    }
  }, [setPlayingState])

  const skip = useCallback((seconds: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + seconds))
  }, [])

  // Expose skip via ref so parent keyboard handler can call it
  // (we use a custom event instead to keep things clean)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ seconds: number }>).detail
      skip(detail.seconds)
    }
    const toggleHandler = () => togglePlay()
    const el = containerRef.current
    el?.addEventListener('pp-skip', handler)
    el?.addEventListener('pp-toggle-play', toggleHandler)
    return () => {
      el?.removeEventListener('pp-skip', handler)
      el?.removeEventListener('pp-toggle-play', toggleHandler)
    }
  }, [skip, togglePlay])

  const handleVolumeChange = useCallback((val: number) => {
    const v = videoRef.current
    if (!v) return
    setVolume(val)
    v.volume = val
    setMuted(val === 0)
    v.muted = val === 0
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    const next = !muted
    setMuted(next)
    v.muted = next
  }, [muted])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 2800)
  }, [playing])

  useEffect(() => {
    resetHideTimer()
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [playing, resetHideTimer])

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // ── Real-time progress bar drag ──────────────────────────────────────────────

  const seekToFrac = useCallback((clientX: number) => {
    const bar = progressBarRef.current
    const v = videoRef.current
    if (!bar || !v || !v.duration) return
    const rect = bar.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    v.currentTime = frac * v.duration
    setProgress(frac)
  }, [])

  const handleProgressPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    seekToFrac(e.clientX)
  }, [seekToFrac])

  const handleProgressPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    seekToFrac(e.clientX)
  }, [seekToFrac])

  const handleProgressPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    isDragging.current = false
    seekToFrac(e.clientX)
  }, [seekToFrac])

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // YouTube fallback — just render an iframe
  if (isYouTube) {
    const embedSrc = (() => {
      const short = src.match(/youtu\.be\/([^?&]+)/)
      if (short) return `https://www.youtube.com/embed/${short[1]}?autoplay=${autoPlay ? 1 : 0}`
      const long = src.match(/[?&]v=([^&]+)/)
      if (long) return `https://www.youtube.com/embed/${long[1]}?autoplay=${autoPlay ? 1 : 0}`
      return src
    })()
    return (
      <iframe
        className="pp-main-video"
        src={embedSrc}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`pp-video-player ${showControls ? 'controls-visible' : ''}`}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (playing) setShowControls(false) }}
    >
      <video
        ref={videoRef}
        className="pp-video-el"
        poster={poster}
        onClick={togglePlay}
        onTimeUpdate={() => {
          const v = videoRef.current
          if (!v || !v.duration || isDragging.current) return
          setProgress(v.currentTime / v.duration)
        }}
        onLoadedMetadata={() => {
          const v = videoRef.current
          if (v) setDuration(v.duration)
        }}
        onEnded={() => setPlayingState(false)}
        onPlay={() => setPlayingState(true)}
        onPause={() => setPlayingState(false)}
      >
        <source src={src} />
      </video>

      {/* Big play overlay when paused */}
      {!playing && (
        <div className="pp-video-play-overlay" onClick={togglePlay}>
          <svg viewBox="0 0 24 24" className="pp-play-big-icon" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      )}

      {/* Controls bar */}
      <div className="pp-video-controls" onClick={(e) => e.stopPropagation()}>
        {/* Progress bar — pointer events for real-time drag */}
        <div
          ref={progressBarRef}
          className="pp-progress-bar"
          onPointerDown={handleProgressPointerDown}
          onPointerMove={handleProgressPointerMove}
          onPointerUp={handleProgressPointerUp}
          onPointerCancel={handleProgressPointerUp}
        >
          <div className="pp-progress-fill" style={{ width: `${progress * 100}%` }} />
          <div className="pp-progress-thumb" style={{ left: `${progress * 100}%` }} />
        </div>

        <div className="pp-controls-row">
          {/* Left cluster */}
          <div className="pp-ctrl-left">
            {/* Rewind 5s */}
            <button className="pp-ctrl-btn" onClick={() => skip(-5)} aria-label="Rewind 5 seconds">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                <text x="12" y="15.5" textAnchor="middle" fontSize="5.5" fontFamily="sans-serif" fill="currentColor">5</text>
              </svg>
            </button>

            {/* Play / Pause */}
            <button className="pp-ctrl-btn pp-ctrl-playpause" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Forward 5s */}
            <button className="pp-ctrl-btn" onClick={() => skip(5)} aria-label="Forward 5 seconds">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z"/>
                <text x="12" y="15.5" textAnchor="middle" fontSize="5.5" fontFamily="sans-serif" fill="currentColor">5</text>
              </svg>
            </button>

            {/* Time */}
            <span className="pp-time">
              {formatTime((videoRef.current?.currentTime) ?? 0)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right cluster */}
          <div className="pp-ctrl-right">
            {/* Mute toggle */}
            <button className="pp-ctrl-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
              {muted || volume === 0 ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97V9.76l2.48 2.48c.01-.08.02-.16.02-.24zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18l1.73 1.73L21 18.46 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : volume < 0.5 ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.5 12A4.5 4.5 0 0 0 16 7.97V16c1.48-.73 2.5-2.25 2.5-4zM5 9v6h4l5 5V4L9 9H5z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </button>

            {/* Volume slider */}
            <input
              type="range"
              className="pp-volume-slider"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              aria-label="Volume"
            />

            {/* Fullscreen */}
            <button className="pp-ctrl-btn" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const project = PROJECTS.find((p) => p.id === Number(id))

  const media = project ? buildMedia(project) : []
  const [activeIndex, setActiveIndex] = useState(0)
  const [autoPlayVideo, setAutoPlayVideo] = useState(false)
  // Track whether the video is actively playing so we can block hover-switching
  const [videoPlaying, setVideoPlaying] = useState(false)
  // Which "page" of 5 thumbnails we're on
  const [stripPage, setStripPage] = useState(0)

  // Lightbox
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxScale, setLightboxScale] = useState(1)
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 })
  const ZOOM_MIN = 0.5
  const ZOOM_MAX = 4
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; panX: number; panY: number; moved: boolean }>({
    dragging: false, startX: 0, startY: 0, panX: 0, panY: 0, moved: false
  })
  const [isDragging, setIsDragging] = useState(false)

  const openLightbox = (src: string) => {
    setLightboxSrc(src)
    setLightboxScale(1)
    setLightboxPan({ x: 0, y: 0 })
  }

  const closeLightbox = () => {
    setLightboxSrc(null)
    setLightboxScale(1)
    setLightboxPan({ x: 0, y: 0 })
  }

  // Keep the lightbox in sync with whichever media item is active.
  // Without this, changing the current image (e.g. via arrow keys) while
  // zoomed in leaves the lightbox showing the old image until it's closed.
  useEffect(() => {
    if (!lightboxSrc) return
    const current = media[activeIndex]
    if (!current || current.kind !== 'image') {
      // Active item is no longer an image (e.g. nav landed on a video) — bail out
      closeLightbox()
      return
    }
    if (current.src !== lightboxSrc) {
      setLightboxSrc(current.src)
      setLightboxScale(1)
      setLightboxPan({ x: 0, y: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex])

  // Close lightbox on Escape; scroll wheel to zoom
  useEffect(() => {
    if (!lightboxSrc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setLightboxScale((s) => {
        const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s - e.deltaY * 0.002))
        if (next <= 1) setLightboxPan({ x: 0, y: 0 })
        return next
      })
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
    }
  }, [lightboxSrc])

  const totalStripPages = Math.ceil(media.length / STRIP_PAGE_SIZE)
  const stripStart = stripPage * STRIP_PAGE_SIZE
  const visibleMedia = media.slice(stripStart, stripStart + STRIP_PAGE_SIZE)

  // When active index changes, make sure we're on the right strip page
  useEffect(() => {
    const page = Math.floor(activeIndex / STRIP_PAGE_SIZE)
    setStripPage(page)
  }, [activeIndex])

  // When we leave the video item, reset videoPlaying
  useEffect(() => {
    const active = media[activeIndex]
    if (active?.kind !== 'video') {
      setVideoPlaying(false)
    }
  }, [activeIndex])

  // Keyboard navigation
  // Left/Right: when video is active → skip ±5s; otherwise navigate items
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const active = media[activeIndex]
      const isVideoActive = active?.kind === 'video'

      if (e.key === 'ArrowLeft') {
        if (isVideoActive) {
          // Skip back 5s inside video
          const player = document.querySelector('.pp-video-player') as HTMLElement | null
          player?.dispatchEvent(new CustomEvent('pp-skip', { detail: { seconds: -5 } }))
        } else {
          setActiveIndex((i) => Math.max(0, i - 1))
          setAutoPlayVideo(false)
        }
      }
      if (e.key === 'ArrowRight') {
        if (isVideoActive) {
          // Skip forward 5s inside video
          const player = document.querySelector('.pp-video-player') as HTMLElement | null
          player?.dispatchEvent(new CustomEvent('pp-skip', { detail: { seconds: 5 } }))
        } else {
          setActiveIndex((i) => Math.min(media.length - 1, i + 1))
          setAutoPlayVideo(false)
        }
      }
      if ((e.key === ' ' || e.key === 'Spacebar') && isVideoActive) {
        e.preventDefault()
        const player = document.querySelector('.pp-video-player') as HTMLElement | null
        player?.dispatchEvent(new CustomEvent('pp-toggle-play'))
      }
      if (e.key === 'Escape') navigate('/CV/portfolio')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [media, activeIndex, navigate])

  // Scroll to top on project change
  useEffect(() => {
    window.scrollTo(0, 0)
    setActiveIndex(0)
    setAutoPlayVideo(false)
    setVideoPlaying(false)
  }, [id])

  if (!project) {
    return (
      <main className="pp-not-found">
        <p>Project not found.</p>
        <Link to="/CV/portfolio">← Back to work</Link>
      </main>
    )
  }

  const active = media[activeIndex]

  const handleThumbClick = (globalIdx: number) => {
    const item = media[globalIdx]
    const isVideo = item.kind === 'video'
    setActiveIndex(globalIdx)
    setAutoPlayVideo(isVideo)
    if (!isVideo) setVideoPlaying(false)
  }

  const handleThumbHover = (globalIdx: number) => {
    // If video is currently playing, require a click — don't switch on hover
    if (videoPlaying) return
    // Only switch on hover for images
    const item = media[globalIdx]
    if (item.kind === 'image') {
      setActiveIndex(globalIdx)
      setAutoPlayVideo(false)
    }
  }

  // Parse details paragraphs
  const detailsParagraphs = project.details
    ? project.details.split('\n\n').filter(Boolean)
    : null

  return (
    <main className="pp-root">

      {/* ── Blurred backdrop ── */}
      <div className="pp-backdrop">
        <img src={project.image} alt="" className="pp-backdrop-img" aria-hidden="true" />
        <div className="pp-backdrop-overlay" />
      </div>

      {/* ── Page content ── */}
      <div className="pp-content">

        <Link to="/Portfolio" className="pp-back">
          <span className="pp-back-arrow">←</span> All projects
        </Link>

        {/* ── Top section: viewer + sidebar ── */}
        <div className="pp-top">

          {/* Viewer column */}
          <div className="pp-viewer-col">

            {/* Main display */}
            <div className="pp-main-display">
              {active.kind === 'video' ? (
                <VideoPlayer
                  src={active.src}
                  poster={active.thumb}
                  isYouTube={active.isYouTube}
                  autoPlay={autoPlayVideo}
                  onPlayingChange={setVideoPlaying}
                />
              ) : (
                <img
                  key={active.src}
                  src={active.src}
                  alt={project.title}
                  className="pp-main-image pp-main-image--clickable"
                  onClick={() => openLightbox(active.src)}
                />
              )}

              {/* Arrow nav (images only — video has its own controls) */}
              {media.length > 1 && active.kind === 'image' && (
                <>
                  <button
                    className="pp-nav pp-nav-prev"
                    onClick={() => { setActiveIndex((i) => Math.max(0, i - 1)); setAutoPlayVideo(false) }}
                    disabled={activeIndex === 0}
                    aria-label="Previous"
                  >‹</button>
                  <button
                    className="pp-nav pp-nav-next"
                    onClick={() => { setActiveIndex((i) => Math.min(media.length - 1, i + 1)); setAutoPlayVideo(false) }}
                    disabled={activeIndex === media.length - 1}
                    aria-label="Next"
                  >›</button>
                </>
              )}
            </div>

            {/* Paginated thumbnail strip */}
            {media.length > 1 && (
              <div className="pp-strip-wrap">
                {/* Prev page button */}
                <button
                  className="pp-strip-page-btn"
                  onClick={() => setStripPage((p) => Math.max(0, p - 1))}
                  disabled={stripPage === 0}
                  aria-label="Previous thumbnails"
                >‹</button>

                <div className="pp-strip">
                  {visibleMedia.map((item, localIdx) => {
                    const globalIdx = stripStart + localIdx
                    return (
                      <button
                        key={globalIdx}
                        className={`pp-strip-thumb ${globalIdx === activeIndex ? 'active' : ''} ${item.kind === 'video' ? 'is-video' : ''}`}
                        onMouseEnter={() => handleThumbHover(globalIdx)}
                        onClick={() => handleThumbClick(globalIdx)}
                        aria-label={item.kind === 'video' ? 'Play video' : `Image ${globalIdx + 1}`}
                      >
                        <img
                          src={item.kind === 'video' ? item.thumb : item.src}
                          alt=""
                          className="pp-strip-img"
                        />
                        {/* SVG play button for video thumbnails */}
                        {item.kind === 'video' && (
                          <div className="pp-strip-play">
                            <svg
                              className="pp-strip-play-icon"
                              viewBox="0 0 48 48"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                              <path d="M19 15.5l16 8.5-16 8.5V15.5z" fill="white"/>
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                  {/* Ghost placeholders — fill remaining slots so space-between stays stable */}
                  {Array.from({ length: STRIP_PAGE_SIZE - visibleMedia.length }).map((_, i) => (
                    <div key={`ghost-${i}`} className="pp-strip-thumb pp-strip-ghost" aria-hidden="true" />
                  ))}
                </div>

                {/* Next page button */}
                <button
                  className="pp-strip-page-btn"
                  onClick={() => setStripPage((p) => Math.min(totalStripPages - 1, p + 1))}
                  disabled={stripPage >= totalStripPages - 1}
                  aria-label="Next thumbnails"
                >›</button>
              </div>
            )}

          </div>

          {/* Right: info sidebar */}
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

            <p className="pp-sidebar-desc">
              {project.description.split('\n\n')[0]}
            </p>

            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="pp-cta"
              >
                View project <span className="pp-cta-arrow">→</span>
              </a>
            )}

            {/* Media counter */}
            {media.length > 1 && (
              <p className="pp-media-count">
                {activeIndex + 1} / {media.length}
              </p>
            )}
          </aside>
        </div>

        {/* ── Details — full write-up ── */}
        {detailsParagraphs && detailsParagraphs.length > 0 && (
          <section className="pp-desc-section">
            <img src={project.image} alt="" className="pp-desc-thumb" />
            <h2 className="pp-desc-heading">About the project</h2>
            <div className="pp-desc-body">
              {detailsParagraphs.map((para, i) => renderDetailsParagraph(project, para, i))}
            </div>
          </section>
        )}

      </div>

      {/* ── Lightbox ── */}
      {lightboxSrc && (
        <div
          className="pp-lightbox-backdrop"
          onClick={() => {
            // Only close if the click wasn't a drag
            if (!dragState.current.moved) closeLightbox()
          }}
        >
          <img
            src={lightboxSrc}
            alt=""
            className={`pp-lightbox-img ${lightboxScale > 1 ? 'pp-lightbox-img--zoomed' : ''}`}
            style={{
              transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxScale})`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              cursor: isDragging ? 'grabbing' : lightboxScale > 1 ? 'grab' : 'zoom-in',
              willChange: 'transform',
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              e.currentTarget.setPointerCapture(e.pointerId)
              dragState.current = {
                dragging: true,
                startX: e.clientX - lightboxPan.x,
                startY: e.clientY - lightboxPan.y,
                panX: lightboxPan.x,
                panY: lightboxPan.y,
                moved: false,
              }
              setIsDragging(true)
            }}
            onPointerMove={(e) => {
              if (!dragState.current.dragging) return
              const dx = e.clientX - dragState.current.startX
              const dy = e.clientY - dragState.current.startY
              if (Math.abs(dx - dragState.current.panX) > 3 || Math.abs(dy - dragState.current.panY) > 3) {
                dragState.current.moved = true
              }
              setLightboxPan({ x: dx, y: dy })
            }}
            onPointerUp={(e) => {
              e.stopPropagation()
              const wasMoved = dragState.current.moved
              dragState.current.dragging = false
              setIsDragging(false)
              if (!wasMoved) {
                const next = lightboxScale > 1 ? 1 : 2
                setLightboxScale(next)
                if (next === 1) setLightboxPan({ x: 0, y: 0 })
              }
              setTimeout(() => { dragState.current.moved = false }, 0)
            }}
          />
          <button
            className="pp-lightbox-close"
            onClick={(e) => { e.stopPropagation(); closeLightbox() }}
            aria-label="Close"
          >✕</button>
        </div>
      )}
    </main>
  )
}