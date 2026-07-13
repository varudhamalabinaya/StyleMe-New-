import type { FaceShapeLabel } from './faceShapeMock'
import { isValidFaceShapeLabel, mockFaceShapeFromImageUri } from './faceShapeMock'
import { supabase } from './supabase'

const ENV_URL = import.meta.env.VITE_FACE_SHAPE_API_URL as string | undefined

/** Keeps Edge / Gemini payloads small (phone photos are often huge as base64). */
async function downscaleBlobForVision(blob: Blob, maxEdge = 1280): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return blob
  try {
    const img = await createImageBitmap(blob)
    try {
      let w = img.width
      let h = img.height
      if (Math.max(w, h) <= maxEdge) return blob
      const scale = maxEdge / Math.max(w, h)
      w = Math.round(w * scale)
      h = Math.round(h * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return blob
      ctx.drawImage(img, 0, 0, w, h)
      const out = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.88)
      })
      return out ?? blob
    } finally {
      img.close()
    }
  } catch {
    return blob
  }
}

/** Supabase `FunctionsHttpError` stores the raw `Response` in `context`, not a parsed body. */
async function messageFromInvokeError(error: unknown): Promise<string> {
  const e = error as { message?: string; context?: Response }
  const res = e.context
  if (res && typeof res.json === 'function') {
    try {
      const j = (await res.clone().json()) as { error?: string; message?: string }
      const inner = j.error ?? j.message
      if (typeof inner === 'string' && inner.length) return inner.slice(0, 500)
    } catch {
      /* fall through */
    }
  }
  return (e.message ?? 'Face shape invoke failed.').slice(0, 500)
}

function resolveFaceShapeEndpoint(): string | null {
  const fromEnv = ENV_URL?.trim()
  if (fromEnv) return fromEnv
  const base = import.meta.env.VITE_SUPABASE_URL?.trim()
  if (base?.startsWith('http')) {
    return `${base.replace(/\/$/, '')}/functions/v1/face-shape`
  }
  return null
}

async function blobToBase64(blob: Blob): Promise<{ base64: string; mimeType: string }> {
  const mimeType =
    blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg'
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!)
  }
  const base64 = btoa(binary)
  const normalizedMime = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType
  return { base64, mimeType: normalizedMime }
}

function parseShapeResponse(data: unknown): FaceShapeLabel {
  let body: { faceShape?: string; error?: string }
  if (typeof data === 'string') {
    try {
      body = JSON.parse(data) as { faceShape?: string; error?: string }
    } catch {
      throw new Error('Invalid JSON in face-shape response.')
    }
  } else {
    body = data as { faceShape?: string; error?: string }
  }
  if (body?.error) throw new Error(body.error.slice(0, 240))
  const shape = body?.faceShape
  if (typeof shape !== 'string' || !isValidFaceShapeLabel(shape)) {
    throw new Error('Invalid faceShape in response.')
  }
  return shape
}

async function requestViaInvoke(imageBase64: string, mimeType: string): Promise<FaceShapeLabel> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  const { data: sessionData } = await supabase!.auth.getSession()
  const bearer = sessionData.session?.access_token ?? anonKey
  const { data, error } = await supabase!.functions.invoke('face-shape', {
    body: { imageBase64, mimeType },
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
  })
  if (error) throw new Error(await messageFromInvokeError(error))
  return parseShapeResponse(data)
}

async function requestViaFetch(
  url: string,
  imageBase64: string,
  mimeType: string,
): Promise<FaceShapeLabel> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const { data: sessionData } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } }
  const accessToken = sessionData.session?.access_token
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  } else if (anonKey) {
    // Edge Function gateway requires Authorization; apikey alone returns UNAUTHORIZED_NO_AUTH_HEADER.
    headers.set('Authorization', `Bearer ${anonKey}`)
  }
  if (anonKey) {
    headers.set('apikey', anonKey)
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ imageBase64, mimeType }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t.slice(0, 240) || `HTTP ${res.status}`)
  }
  const json = await res.json()
  return parseShapeResponse(json)
}

/**
 * Classifies face shape via Edge Function + Gemini when configured; otherwise uses the deterministic mock.
 */
export async function analyzeFaceShapeFromPhoto(blob: Blob): Promise<{
  label: FaceShapeLabel
  usedFallback: boolean
  /** Present when vision was attempted but failed (safe to show user). */
  detail?: string
}> {
  const scaled = await downscaleBlobForVision(blob)
  const { base64, mimeType } = await blobToBase64(scaled)
  const fallbackSeed = `fallback:${base64.slice(0, 2000)}`
  const fallbackLabel = mockFaceShapeFromImageUri(fallbackSeed)

  const endpoint = resolveFaceShapeEndpoint()
  if (!endpoint) {
    return { label: fallbackLabel, usedFallback: true, detail: 'No face-shape endpoint in env.' }
  }

  const fnMatch = endpoint.match(/https?:\/\/[^/]+\.supabase\.co\/functions\/v1\/([^/?#]+)/i)
  const useInvoke = Boolean(supabase && fnMatch?.[1] === 'face-shape')
  try {
    if (useInvoke) {
      const label = await requestViaInvoke(base64, mimeType)
      return { label, usedFallback: false }
    }
    const label = await requestViaFetch(endpoint, base64, mimeType)
    return { label, usedFallback: false }
  } catch (e) {
    const detail = e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500)
    return { label: fallbackLabel, usedFallback: true, detail }
  }
}

export function isFaceShapeVisionConfigured(): boolean {
  return resolveFaceShapeEndpoint() !== null
}
