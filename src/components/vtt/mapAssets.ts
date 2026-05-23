/** Private bucket from phase_f6_game_assets_bucket migration. */
export const GAME_ASSETS_BUCKET = 'game-assets'

export const MAP_MAX_BYTES = 10 * 1024 * 1024
export const MAP_MAX_DIMENSION = 4096

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])

export function mapObjectPath(gameId: string, sceneId: string, ext: string): string {
  const safeExt = ext.replace(/^\./, '').toLowerCase()
  return `${gameId}/${sceneId}/map.${safeExt}`
}

export function extensionForMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

export function validateMapFile(file: File): string | null {
  if (!ALLOWED_MIME.has(file.type)) {
    return 'Map must be PNG, JPEG, or WebP.'
  }
  if (file.size > MAP_MAX_BYTES) {
    return 'Map file must be 10 MB or smaller.'
  }
  return null
}

export function loadImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image dimensions.'))
    }
    img.src = url
  })
}
