import type { SetupState, StyleIdea } from '../types/wizard'
import { supabase } from './supabase'

const ENDPOINT = import.meta.env.VITE_HAIR_PREVIEW_API_URL as string | undefined

export type HairPreviewContext = {
  faceShape: string | null
  prompt: string
  selectedStylePill: string | null
  setup: SetupState
  ideas: Pick<StyleIdea, 'title' | 'description'>[]
}

/** Builds a single English prompt your image backend can use (img2img / edit). */
export function buildHairGenerationPrompt(ctx: HairPreviewContext): string {
  const pill = ctx.selectedStylePill ?? 'balanced hairstyle'
  const shape = ctx.faceShape ?? 'general'
  const occ = ctx.setup.occasion || 'everyday'
  return [
    'Hairstyle visualization for the same person as in the reference photo.',
    `Face shape (guide): ${shape}.`,
    `Style direction: ${pill}. Occasion: ${occ}.`,
    `Length preference: ${ctx.setup.hairLengthPref || 'flexible'}. Goal: ${ctx.setup.hairGoal || 'refresh'}.`,
    ctx.prompt.trim() ? `Client note: ${ctx.prompt.trim().slice(0, 400)}` : '',
    'Keep identity recognizable; natural lighting; photorealistic portrait framing.',
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * POST multipart to your own backend (Edge Function, etc.) to obtain preview image URLs.
 * Expected JSON body: { "images": ["https://..."] } or { "urls": ["https://..."] }.
 * Omit VITE_HAIR_PREVIEW_API_URL to skip (orbit + text cards only).
 */
export async function fetchHairPreviewImages(
  photoBlob: Blob,
  ctx: HairPreviewContext,
): Promise<string[] | null> {
  const url = ENDPOINT?.trim()
  if (!url) return null
  // #region agent log
  fetch('http://127.0.0.1:7570/ingest/611a9058-6d13-46d2-9d9c-e0ad2d3831ae', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fa144a' },
    body: JSON.stringify({
      sessionId: 'fa144a',
      runId: 'pre-fix',
      hypothesisId: 'A',
      location: 'hairPreviewApi.ts:fetchHairPreviewImages:entry',
      message: 'hair preview request start',
      data: {
        endpointHost: (() => {
          try {
            return new URL(url).host
          } catch {
            return 'invalid-url'
          }
        })(),
        photoType: photoBlob.type || null,
        ideasCount: ctx.ideas.length,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  const fd = new FormData()
  fd.append(
    'photo',
    photoBlob,
    photoBlob.type.includes('png') ? 'photo.png' : 'photo.jpg',
  )
  fd.append(
    'context',
    JSON.stringify({
      ...ctx,
      generationPrompt: buildHairGenerationPrompt(ctx),
    }),
  )

  const headers = new Headers()
  const { data: sessionData } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } }
  const accessToken = sessionData.session?.access_token
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    headers.set('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY)
  }

  /** Same Supabase project → use JS client invoke (avoids browser CORS "Failed to fetch" on raw fetch). */
  const fnMatch = url.match(/https?:\/\/[^/]+\.supabase\.co\/functions\/v1\/([^/?#]+)/i)
  if (supabase && fnMatch) {
    const fnName = fnMatch[1]
    // #region agent log
    fetch('http://127.0.0.1:7570/ingest/611a9058-6d13-46d2-9d9c-e0ad2d3831ae', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fa144a' },
      body: JSON.stringify({
        sessionId: 'fa144a',
        runId: 'post-fix',
        hypothesisId: 'F',
        location: 'hairPreviewApi.ts:fetchHairPreviewImages:invoke',
        message: 'using supabase.functions.invoke',
        data: { fnName },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    const { data: invokeData, error: invokeErr } = await supabase.functions.invoke(fnName, {
      body: fd,
    })
    if (invokeErr) {
      // #region agent log
      fetch('http://127.0.0.1:7570/ingest/611a9058-6d13-46d2-9d9c-e0ad2d3831ae', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fa144a' },
        body: JSON.stringify({
          sessionId: 'fa144a',
          runId: 'post-fix',
          hypothesisId: 'F',
          location: 'hairPreviewApi.ts:fetchHairPreviewImages:invokeError',
          message: 'invoke returned error',
          data: { errMessage: invokeErr.message?.slice(0, 200) ?? String(invokeErr).slice(0, 200) },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      throw new Error(invokeErr.message || 'Preview function invoke failed.')
    }
    const responseBody = invokeData as { images?: string[]; urls?: string[]; error?: string }
    if (responseBody?.error) {
      throw new Error(responseBody.error.slice(0, 240))
    }
    const list = responseBody.images ?? responseBody.urls ?? []
    // #region agent log
    fetch('http://127.0.0.1:7570/ingest/611a9058-6d13-46d2-9d9c-e0ad2d3831ae', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fa144a' },
      body: JSON.stringify({
        sessionId: 'fa144a',
        runId: 'post-fix',
        hypothesisId: 'D',
        location: 'hairPreviewApi.ts:fetchHairPreviewImages:afterInvokeParse',
        message: 'invoke response parsed',
        data: {
          imagesCount: list.length,
          hasImagesKey: Array.isArray(responseBody.images),
          hasUrlsKey: Array.isArray(responseBody.urls),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    return list.length > 0 ? list : null
  }

  // #region agent log
  fetch('http://127.0.0.1:7570/ingest/611a9058-6d13-46d2-9d9c-e0ad2d3831ae', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fa144a' },
    body: JSON.stringify({
      sessionId: 'fa144a',
      runId: 'post-fix',
      hypothesisId: 'B',
      location: 'hairPreviewApi.ts:fetchHairPreviewImages:beforeFetch',
      message: 'sending raw preview fetch (non-supabase URL or no client)',
      data: {
        hasAuthorization: Boolean(accessToken),
        hasApiKeyHeader: headers.has('apikey'),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  let res: Response
  try {
    res = await fetch(url, { method: 'POST', body: fd, headers })
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7570/ingest/611a9058-6d13-46d2-9d9c-e0ad2d3831ae', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fa144a' },
      body: JSON.stringify({
        sessionId: 'fa144a',
        runId: 'post-fix',
        hypothesisId: 'C',
        location: 'hairPreviewApi.ts:fetchHairPreviewImages:fetchThrew',
        message: 'fetch threw (network/CORS)',
        data: {
          errName: err instanceof Error ? err.name : 'unknown',
          errMessage: err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    throw err instanceof Error ? err : new Error('Network error calling preview API.')
  }
  // #region agent log
  fetch('http://127.0.0.1:7570/ingest/611a9058-6d13-46d2-9d9c-e0ad2d3831ae', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fa144a' },
    body: JSON.stringify({
      sessionId: 'fa144a',
      runId: 'post-fix',
      hypothesisId: 'C',
      location: 'hairPreviewApi.ts:fetchHairPreviewImages:afterFetch',
      message: 'preview fetch response received',
      data: {
        status: res.status,
        ok: res.ok,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text.slice(0, 240) || `Preview API HTTP ${res.status}`)
  }

  const responseBody = (await res.json()) as { images?: string[]; urls?: string[] }
  const list = responseBody.images ?? responseBody.urls ?? []
  // #region agent log
  fetch('http://127.0.0.1:7570/ingest/611a9058-6d13-46d2-9d9c-e0ad2d3831ae', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fa144a' },
    body: JSON.stringify({
      sessionId: 'fa144a',
      runId: 'post-fix',
      hypothesisId: 'D',
      location: 'hairPreviewApi.ts:fetchHairPreviewImages:afterParse',
      message: 'preview response parsed',
      data: {
        imagesCount: list.length,
        hasImagesKey: Array.isArray(responseBody.images),
        hasUrlsKey: Array.isArray(responseBody.urls),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
  return list.length > 0 ? list : null
}

export function isHairPreviewApiConfigured(): boolean {
  return Boolean(ENDPOINT?.trim())
}
