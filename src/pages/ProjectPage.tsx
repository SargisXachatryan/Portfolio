import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import projectsData from '../data/projects.json'
import type { Project } from '../types'
import { buildMedia } from '../utils/projectMedia'
import MediaGallery from '../components/project_components/MediaGallery'
import ProjectSidebar from '../components/project_components/ProjectSidebar'
import ProjectDetails from '../components/project_components/ProjectDetails'
import Lightbox from '../components/project_components/Lightbox'
import ProjectPageSkeleton from '../components/project_components/ProjectPageSkeleton'
import './styles/ProjectPage.css'

const PROJECTS = projectsData as Project[]

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const project = PROJECTS.find((p) => p.id === Number(id))

  const media = project ? buildMedia(project) : []
  const [activeIndex, setActiveIndex] = useState(0)
  const [autoPlayVideo, setAutoPlayVideo] = useState(false)
  // Track whether the video is actively playing so we can block hover-switching
  const [videoPlaying, setVideoPlaying] = useState(false)

  // Lightbox — MediaGallery/Lightbox each own their own interaction state;
  // this page only tracks which image (if any) is currently shown.
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  // Hero image preload — gates the loading skeleton. Data itself is a static
  // import (instant), but the image is the real async resource, so that's
  // what the skeleton actually waits on.
  const [heroLoaded, setHeroLoaded] = useState(false)

  const openLightbox = (src: string) => setLightboxSrc(src)
  const closeLightbox = () => setLightboxSrc(null)

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Scroll to top on project change, and reset per-project state
  useEffect(() => {
    window.scrollTo(0, 0)
    setActiveIndex(0)
    setAutoPlayVideo(false)
    setVideoPlaying(false)
    setHeroLoaded(false)
  }, [id])

  // Preload the hero image so the skeleton has something real to wait on
  useEffect(() => {
    if (!project) return
    const img = new Image()
    img.onload = () => setHeroLoaded(true)
    img.onerror = () => setHeroLoaded(true) // don't get stuck on a broken image
    img.src = project.image
    // If it's already cached, onload may not fire in every browser — check directly.
    if (img.complete) setHeroLoaded(true)
  }, [project])

  if (!project) {
    return (
      <main className="pp-not-found">
        <p>Project not found.</p>
        <Link to="/CV/portfolio">← Back to work</Link>
      </main>
    )
  }

  if (!heroLoaded) {
    return <ProjectPageSkeleton />
  }

  // Parse details paragraphs
  const detailsParagraphs = project.details
    ? project.details.split('\n\n').filter(Boolean)
    : []

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
            <MediaGallery
              project={project}
              media={media}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              autoPlayVideo={autoPlayVideo}
              onAutoPlayVideoChange={setAutoPlayVideo}
              videoPlaying={videoPlaying}
              onVideoPlayingChange={setVideoPlaying}
              onImageClick={openLightbox}
            />
          </div>

          <ProjectSidebar project={project} activeIndex={activeIndex} mediaCount={media.length} />
        </div>

        <ProjectDetails project={project} paragraphs={detailsParagraphs} />

      </div>

      <Lightbox src={lightboxSrc} onClose={closeLightbox} />
    </main>
  )
}
