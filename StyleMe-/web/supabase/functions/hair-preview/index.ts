import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // Browser preflight may include Supabase client headers (e.g. x-client-info).
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, accept, accept-profile, content-profile, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type HairPreviewContext = {
  faceShape?: string | null
  prompt?: string
  selectedStylePill?: string | null
  setup?: {
    gender?: string
    occasion?: string
    hairLengthPref?: string
    hairGoal?: string
  }
  ideas?: Array<{ title: string; description: string }>
  generationPrompt?: string
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizePrompt(base: string, hairstyle: string): string {
  return [
    base,
    `Target hairstyle: ${hairstyle}.`,
    'Generate a photoreal salon-style makeover of the same person from the reference image.',
    'Keep facial identity, skin tone, eye color, and camera perspective consistent.',
    'Only change hairstyle and subtle grooming details; avoid changing age or ethnicity.',
    'High-detail, natural lighting, realistic hair strands, editorial beauty quality.',
  ].join(' ')
}

async function editImageWithOpenAI(
  photo: File,
  prompt: string,
  apiKey: string,
): Promise<Uint8Array> {
  const form = new FormData()
  form.append('model', 'gpt-image-1')
  form.append('image', photo, photo.name || 'photo.jpg')
  form.append('prompt', prompt)
  form.append('size', '1024x1024')
  form.append('quality', 'high')

  const resp = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`OpenAI edit failed (${resp.status}): ${text.slice(0, 250)}`)
  }

  const body = (await resp.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>
  }
  const image = body.data?.[0]
  if (!image) throw new Error('OpenAI returned no image.')

  if (image.b64_json) {
    const raw = atob(image.b64_json)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
    return bytes
  }

  if (image.url) {
    const fetched = await fetch(image.url)
    if (!fetched.ok) throw new Error('Failed to download generated image URL.')
    return new Uint8Array(await fetched.arrayBuffer())
  }

  throw new Error('OpenAI response missing b64_json/url.')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const bucket = Deno.env.get('HAIR_PREVIEW_BUCKET') || 'styleme-photos'

  if (!openAiApiKey) return json({ error: 'Missing OPENAI_API_KEY secret.' }, 500)
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' }, 500)
  }

  try {
    const form = await req.formData()
    const photo = form.get('photo')
    const contextRaw = form.get('context')

    if (!(photo instanceof File)) return json({ error: 'photo file is required' }, 400)
    if (typeof contextRaw !== 'string') return json({ error: 'context JSON is required' }, 400)

    const context = JSON.parse(contextRaw) as HairPreviewContext
    const basePrompt =
      context.generationPrompt?.trim() ||
      [
        `Face shape: ${context.faceShape || 'general'}.`,
        `Style direction: ${context.selectedStylePill || 'balanced hairstyle'}.`,
        `Gender preference: ${context.setup?.gender || 'unspecified'}.`,
        `Occasion: ${context.setup?.occasion || 'everyday'}.`,
        `Length preference: ${context.setup?.hairLengthPref || 'flexible'}.`,
        `Hair goal: ${context.setup?.hairGoal || 'refresh'}.`,
        context.prompt ? `Client note: ${context.prompt.slice(0, 300)}` : '',
      ]
        .filter(Boolean)
        .join(' ')

    const defaultStyles = [
      'Wolf Cut',
      'Textured Bixie (Bob-Pixie)',
      'Soft Layered Lob',
      'Curtain Shag',
      'Polished Textured Bob',
    ]
    const targetStyles = (context.ideas?.map((i) => i.title).filter(Boolean) || defaultStyles).slice(
      0,
      5,
    )

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const now = Date.now()
    const images: string[] = []

    for (let i = 0; i < targetStyles.length; i += 1) {
      const style = targetStyles[i]
      const prompt = normalizePrompt(basePrompt, style)
      const bytes = await editImageWithOpenAI(photo, prompt, openAiApiKey)
      const path = `generated/${now}-${i + 1}.png`
      const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(path, bytes, {
        upsert: true,
        contentType: 'image/png',
      })
      if (upErr) throw upErr

      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60 * 24 * 30)
      if (signErr || !signed?.signedUrl) {
        throw signErr || new Error('Could not sign generated image URL.')
      }
      images.push(signed.signedUrl)
    }

    return json({ images, count: images.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return json({ error: message }, 500)
  }
})

