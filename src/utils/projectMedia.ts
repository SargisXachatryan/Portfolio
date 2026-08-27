import type { Project } from '../types'

export function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url)
}

export type MediaItem =
  | { kind: 'video'; src: string; thumb: string; isYouTube: boolean }
  | { kind: 'image'; src: string }

export function buildMedia(project: Project): MediaItem[] {
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
export const DESC_IMG_TOKEN = /\$\$([^$]+)\$\$/g

export function resolveDescImage(project: Project, token: string): string | undefined {
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
