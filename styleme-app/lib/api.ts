import axios from 'axios'
import { Platform } from 'react-native'
import { parseApiError } from './apiError'

const ENV_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL
const FALLBACK_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080'

/** Resolved at bundle time from EXPO_PUBLIC_API_BASE_URL, else platform fallback. */
export const API_BASE_URL = ENV_API_BASE_URL ?? FALLBACK_API_BASE_URL

export const apiConfigDebug = {
  envValue: ENV_API_BASE_URL ?? null,
  fallbackValue: FALLBACK_API_BASE_URL,
  resolvedBaseUrl: API_BASE_URL,
  usingFallback: !ENV_API_BASE_URL,
  platform: Platform.OS,
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
})

// Log once when the API module loads so Metro shows the resolved base URL.
console.log('[StyleMe API] config', apiConfigDebug)

export { parseApiError }

export type StyleSessionPayload = {
  gender: string
  occasion: string
  goal: string
  hairLength: string
  faceShape: string
  userPrompt: string
  stylePill?: string | null
}

export type CreateSessionResponse = {
  id: string
}

export const PREVIEW_IMAGE_COUNT = 4

export type GenerateImagesResponse = {
  images: string[]
  count: number
}

/** Rewrite backend image URLs so they load on a physical device (not localhost). */
export function normalizeGeneratedImageUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('data:')) return url

  const apiBase = API_BASE_URL.replace(/\/$/, '')

  if (url.startsWith('/')) {
    return `${apiBase}${url}`
  }

  try {
    const parsed = new URL(url)
    const apiOrigin = new URL(apiBase)
    const localHosts = new Set(['localhost', '127.0.0.1', '10.0.2.2'])
    if (localHosts.has(parsed.hostname)) {
      parsed.protocol = apiOrigin.protocol
      parsed.hostname = apiOrigin.hostname
      parsed.port = apiOrigin.port
      return parsed.toString()
    }
  } catch {
    // Keep original if URL parsing fails.
  }

  return url
}

function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

export async function createStyleSession(
  photoUri: string,
  payload: StyleSessionPayload,
): Promise<string> {
  const url = buildApiUrl('/api/sessions')
  console.log('[StyleMe API] createStyleSession →', url, {
    photoUri: photoUri?.slice(0, 80),
    faceShape: payload.faceShape,
    stylePill: payload.stylePill,
  })

  const form = new FormData()
  const filename = photoUri.toLowerCase().endsWith('.png') ? 'photo.png' : 'photo.jpg'
  const mime = filename.endsWith('.png') ? 'image/png' : 'image/jpeg'

  form.append('photo', {
    uri: photoUri,
    name: filename,
    type: mime,
  } as unknown as Blob)
  form.append('gender', payload.gender)
  form.append('occasion', payload.occasion)
  form.append('hairLength', payload.hairLength)
  form.append('goal', payload.goal)
  form.append('faceShape', payload.faceShape)
  form.append('userPrompt', payload.userPrompt)
  if (payload.stylePill) {
    form.append('stylePill', payload.stylePill)
  }

  const { data } = await api.post<CreateSessionResponse>(
    '/api/sessions',
    form
  )
  console.log('[StyleMe API] createStyleSession ✓ sessionId=', data.id)
  return data.id
}

export async function generateSessionImages(sessionId: string): Promise<string[]> {
  const url = buildApiUrl(`/api/sessions/${sessionId}/generate`)
  console.log('[StyleMe API] generateSessionImages →', url)

  const { data } = await api.post<GenerateImagesResponse>(`/api/sessions/${sessionId}/generate`)
  const rawImages = data.images ?? []
  const images = rawImages.map(normalizeGeneratedImageUrl)
  console.log('[StyleMe API] generateSessionImages ✓ count=', data.count, 'expected=', PREVIEW_IMAGE_COUNT)
  if (images.length !== PREVIEW_IMAGE_COUNT) {
    console.warn(
      `[StyleMe API] expected ${PREVIEW_IMAGE_COUNT} images but received ${images.length}`,
    )
  }
  console.log('[StyleMe API] generateSessionImages raw images:', rawImages)
  console.log('[StyleMe API] generateSessionImages normalized images:', images)
  return images
}
