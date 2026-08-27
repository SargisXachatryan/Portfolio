import { useEffect, useState } from 'react'
import type { Project } from '../../types'
import type { MediaItem } from '../../utils/projectMedia'
import VideoPlayer from './VideoPlayer'
import './styles/MediaGallery.css'

const STRIP_PAGE_SIZE = 5

interface MediaGalleryProps {
  project: Project
  media: MediaItem[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  autoPlayVideo: boolean
  onAutoPlayVideoChange: (val: boolean) => void
  onVideoPlayingChange: (val: boolean) => void
  videoPlaying: boolean
  onImageClick: (src: string) => void
}

export default function MediaGallery({
  project,
  media,
  activeIndex,
  onActiveIndexChange,
  autoPlayVideo,
  onAutoPlayVideoChange,
  onVideoPlayingChange,
  videoPlaying,
  onImageClick,
}: MediaGalleryProps) {
  // Which "page" of 5 thumbnails we're on
  const [stripPage, setStripPage] = useState(0)

  const active = media[activeIndex]
  const totalStripPages = Math.ceil(media.length / STRIP_PAGE_SIZE)
  const stripStart = stripPage * STRIP_PAGE_SIZE
  const visibleMedia = media.slice(stripStart, stripStart + STRIP_PAGE_SIZE)

  // When active index changes, make sure we're on the right strip page
  useEffect(() => {
    const page = Math.floor(activeIndex / STRIP_PAGE_SIZE)
    setStripPage(page)
  }, [activeIndex])

  const handleThumbClick = (globalIdx: number) => {
    const item = media[globalIdx]
    const isVideo = item.kind === 'video'
    onActiveIndexChange(globalIdx)
    onAutoPlayVideoChange(isVideo)
    if (!isVideo) onVideoPlayingChange(false)
  }

  const handleThumbHover = (globalIdx: number) => {
    // If video is currently playing, require a click — don't switch on hover
    if (videoPlaying) return
    // Only switch on hover for images
    const item = media[globalIdx]
    if (item.kind === 'image') {
      onActiveIndexChange(globalIdx)
      onAutoPlayVideoChange(false)
    }
  }

  if (!active) return null

  return (
    <>
      {/* Main display */}
      <div className="pp-main-display">
        {active.kind === 'video' ? (
          <VideoPlayer
            src={active.src}
            poster={active.thumb}
            isYouTube={active.isYouTube}
            autoPlay={autoPlayVideo}
            onPlayingChange={onVideoPlayingChange}
          />
        ) : (
          <img
            key={active.src}
            src={active.src}
            alt={project.title}
            className="pp-main-image pp-main-image--clickable"
            onClick={() => onImageClick(active.src)}
          />
        )}

        {/* Arrow nav (images only — video has its own controls) */}
        {media.length > 1 && active.kind === 'image' && (
          <>
            <button
              className="pp-nav pp-nav-prev"
              onClick={() => { onActiveIndexChange(Math.max(0, activeIndex - 1)); onAutoPlayVideoChange(false) }}
              disabled={activeIndex === 0}
              aria-label="Previous"
            >‹</button>
            <button
              className="pp-nav pp-nav-next"
              onClick={() => { onActiveIndexChange(Math.min(media.length - 1, activeIndex + 1)); onAutoPlayVideoChange(false) }}
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
    </>
  )
}

export { STRIP_PAGE_SIZE }
