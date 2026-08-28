import { useState, useEffect, useRef, useCallback } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import './styles/VideoPlayer.css'

interface VideoPlayerProps {
  src: string
  poster: string
  isYouTube: boolean
  autoPlay?: boolean
  /** Called whenever play/pause state changes so parent can react */
  onPlayingChange?: (playing: boolean) => void
}

export default function VideoPlayer({ src, poster, isYouTube, autoPlay = false, onPlayingChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // For real-time drag on progress bar
  const isDragging = useRef(false)
  const progressBarRef = useRef<HTMLDivElement>(null)
  // Pending single-tap timers for the mobile double-tap-to-skip zones,
  // keyed by side, so a lone tap can still resolve to play/pause.
  const tapTimer = useRef<{ left: ReturnType<typeof setTimeout> | null; right: ReturnType<typeof setTimeout> | null }>({ left: null, right: null })
  const lastTap = useRef<{ left: number; right: number }>({ left: 0, right: 0 })

  // No fine hover-capable pointer (phones/tablets) — adds the two edge
  // zones for double-tap-to-skip, on top of (not replacing) the normal
  // control bar, which stays exactly as-is on both desktop and mobile.
  const supportsHover =
    typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

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

  const handleProgressPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    seekToFrac(e.clientX)
  }, [seekToFrac])

  const handleProgressPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    seekToFrac(e.clientX)
  }, [seekToFrac])

  const handleProgressPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
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

  // Double-tap-to-skip on the mobile edge zones. A single tap resolves
  // (after a short wait, in case a second tap follows) to a normal
  // play/pause toggle — same as tapping anywhere else on the video. A
  // second tap within 300ms on the same side skips instead.
  const handleZoneTap = useCallback((side: 'left' | 'right') => {
    const now = Date.now()
    const since = now - lastTap.current[side]
    const pending = tapTimer.current[side]
    if (pending) {
      clearTimeout(pending)
      tapTimer.current[side] = null
    }
    if (since < 300) {
      lastTap.current[side] = 0
      skip(side === 'left' ? -5 : 5)
    } else {
      lastTap.current[side] = now
      tapTimer.current[side] = setTimeout(() => {
        togglePlay()
        tapTimer.current[side] = null
      }, 300)
    }
  }, [skip, togglePlay])

  useEffect(() => {
    return () => {
      if (tapTimer.current.left) clearTimeout(tapTimer.current.left)
      if (tapTimer.current.right) clearTimeout(tapTimer.current.right)
    }
  }, [])

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

      {/* Double-tap zones — mobile only. Sit above the video but below
          the pause-overlay and controls bar, so tapping the visible
          center third still falls through to the video's own onClick. */}
      {!supportsHover && (
        <>
          <div
            className="pp-tap-zone pp-tap-zone-left"
            onTouchEnd={(e) => { e.preventDefault(); handleZoneTap('left') }}
          />
          <div
            className="pp-tap-zone pp-tap-zone-right"
            onTouchEnd={(e) => { e.preventDefault(); handleZoneTap('right') }}
          />
        </>
      )}

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