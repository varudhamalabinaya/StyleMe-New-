const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, accept, accept-profile, content-profile, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED_SHAPES = ['Oval', 'Round', 'Square', 'Heart', 'Oblong'] as const
type FaceShapeLabel = (typeof ALLOWED_SHAPES)[number]

/** Multimodal + structured JSON is flaky with responseMimeType on some models; we parse text instead. */
const DEFAULT_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeFaceShape(raw: unknown): FaceShapeLabel | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  const hit = ALLOWED_SHAPES.find((s) => s.toLowerCase() === t.toLowerCase())
  return hit ?? null
}

function parseModelJson(text: string): { faceShape?: unknown } | null {
  const trimmed = text.trim()
  try {
    if (trimmed.startsWith('```')) {
      const m = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (m?.[1]) return JSON.parse(m[1].trim()) as { faceShape?: unknown }
    }
    return JSON.parse(trimmed) as { faceShape?: unknown }
  } catch {
    return null
  }
}

const VISION_PROMPT = `You are assisting a consumer hairstyle app. Look at the face in the image.

Classify the person's face shape as EXACTLY ONE of these labels (cosmetic / fashion sense only, not medical):
Oval, Round, Square, Heart, Oblong

Rules:
- If the face is not clearly visible, guess the closest label anyway.
- Reply with JSON only, no markdown, no extra keys.
- Use this exact shape: {"faceShape":"<label>"} where <label> is one of: Oval, Round, Square, Heart, Oblong.
`

async function geminiClassifyFaceShape(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
): Promise<FaceShapeLabel> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: VISION_PROMPT },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Gemini request failed (${resp.status}): ${errText.slice(0, 400)}`)
  }

  const body = (await resp.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    error?: { message?: string }
  }

  if (body.error?.message) {
    throw new Error(body.error.message.slice(0, 300))
  }

  const cand = body.candidates?.[0]
  const finish = (cand as { finishReason?: string } | undefined)?.finishReason
  if (finish && finish !== 'STOP') {
    throw new Error(`Gemini finish: ${finish}`)
  }

  const text =
    cand?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? ''

  if (!text) {
    const hint = JSON.stringify(body).slice(0, 280)
    throw new Error(`Gemini returned no text. ${hint}`)
  }

  const parsed = parseModelJson(text)
  const label = normalizeFaceShape(parsed?.faceShape)
  if (!label) {
    throw new Error(`Invalid faceShape in model output: ${text.slice(0, 120)}`)
  }

  return label
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey?.trim()) {
    return json({ error: 'Missing GEMINI_API_KEY secret.' }, 503)
  }

  try {
    let payload: { imageBase64?: string; mimeType?: string }
    try {
      payload = (await req.json()) as { imageBase64?: string; mimeType?: string }
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400)
    }

    const imageBase64 =
      typeof payload.imageBase64 === 'string' ? payload.imageBase64.trim() : ''
    if (!imageBase64) {
      return json({ error: 'imageBase64 is required.' }, 400)
    }

    let mimeType =
      typeof payload.mimeType === 'string' && payload.mimeType.trim()
        ? payload.mimeType.trim().toLowerCase()
        : 'image/jpeg'
    if (mimeType === 'image/jpg') mimeType = 'image/jpeg'

    const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    if (!allowedMime.has(mimeType)) {
      return json({ error: 'mimeType must be image/jpeg, image/png, image/webp, or image/gif.' }, 400)
    }

    const label = await geminiClassifyFaceShape(imageBase64, mimeType, apiKey)
    return json({ faceShape: label })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return json({ error: message }, 500)
  }
})
