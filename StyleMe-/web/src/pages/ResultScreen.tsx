import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardList } from '../components/ui/Card'
import { OrbitGallery } from '../components/ui/OrbitGallery'
import { Screen } from '../components/ui/Screen'
import { useWizard } from '../context/useWizard'
import { fetchHairPreviewImages, isHairPreviewApiConfigured } from '../lib/hairPreviewApi'
import { isSupabaseConfigured, supabase, supabaseSaveDisabledMessage } from '../lib/supabase'
import { paths } from '../routes/paths'
import type { StyleIdea } from '../types/wizard'

const BUCKET = 'styleme-photos'

const STYLE_META = [
  { confidence: 93, tags: ['Iconic 2026', 'Gender-fluid', 'Med maintenance'], maintenance: 3, time: '12-18 min' },
  { confidence: 87, tags: ['Edgy', 'Low maintenance', 'Versatile'], maintenance: 2, time: '5-8 min' },
  { confidence: 89, tags: ['Soft texture', 'Face-framing', 'Trend-safe'], maintenance: 2, time: '8-12 min' },
  { confidence: 84, tags: ['Airy bangs', 'Movement', 'Salon finish'], maintenance: 3, time: '10-15 min' },
  { confidence: 86, tags: ['Polished', 'Everyday', 'Smart volume'], maintenance: 2, time: '7-10 min' },
]

function buildSummaryText(input: {
  setup: { occasion: string; hairLengthPref: string; hairGoal: string }
  faceShape: string | null
  prompt: string
  selectedStylePill: string | null
  ideas: StyleIdea[]
}): string {
  const lines = [
    'StyleMe — session summary',
    '',
    `Occasion: ${input.setup.occasion}`,
    `Length: ${input.setup.hairLengthPref}`,
    `Goal: ${input.setup.hairGoal}`,
    `Face shape (demo): ${input.faceShape ?? '—'}`,
    `Style note: ${input.prompt || '—'}`,
    `Style direction: ${input.selectedStylePill ?? '—'}`,
    '',
    'Ideas:',
    ...input.ideas.map((i) => `• ${i.title}: ${i.description}`),
  ]
  return lines.join('\n')
}

export function ResultScreen() {
  const navigate = useNavigate()
  const {
    resultIdeas,
    setResultIdeas,
    setup,
    faceShape,
    prompt,
    selectedStylePill,
    imageUri,
  } = useWizard()
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [copyMsg, setCopyMsg] = useState<string | null>(null)
  const [previewMsg, setPreviewMsg] = useState<string | null>(null)
  const [previewBusy, setPreviewBusy] = useState(false)
  const ideasRef = useRef(resultIdeas)
  ideasRef.current = resultIdeas

  useEffect(() => {
    if (resultIdeas.length === 0) navigate(paths.prompt, { replace: true })
  }, [resultIdeas.length, navigate])

  useEffect(() => {
    if (!imageUri || !isHairPreviewApiConfigured()) return
    // #region agent log
    fetch('http://127.0.0.1:7570/ingest/611a9058-6d13-46d2-9d9c-e0ad2d3831ae', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fa144a' },
      body: JSON.stringify({
        sessionId: 'fa144a',
        runId: 'pre-fix',
        hypothesisId: 'E',
        location: 'ResultScreen.tsx:useEffect:previewStart',
        message: 'preview effect started',
        data: {
          hasImageUri: Boolean(imageUri),
          ideasCount: resultIdeas.length,
          apiConfigured: isHairPreviewApiConfigured(),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    const ideasSnapshot = [...ideasRef.current]
    let cancelled = false
    setPreviewBusy(true)
    setPreviewMsg(null)
    ;(async () => {
      try {
        const blob = await fetch(imageUri).then((r) => r.blob())
        const urls = await fetchHairPreviewImages(blob, {
          faceShape,
          prompt,
          selectedStylePill,
          setup,
          ideas: ideasSnapshot.map(({ title, description }) => ({ title, description })),
        })
        if (cancelled) return
        if (urls?.length) {
          setResultIdeas(
            ideasSnapshot.map((idea, i) => ({ ...idea, imageUrl: urls[i] ?? idea.imageUrl })),
          )
          setPreviewMsg(`Loaded ${urls.length} generated preview${urls.length === 1 ? '' : 's'}.`)
        } else {
          setPreviewMsg(
            'Preview API returned no images. Respond with JSON { "images": ["https://..."] } or { "urls": [...] }.',
          )
        }
      } catch (e) {
        if (!cancelled) {
          setPreviewMsg(e instanceof Error ? e.message : 'Preview generation failed.')
        }
      } finally {
        if (!cancelled) setPreviewBusy(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [faceShape, imageUri, prompt, selectedStylePill, setResultIdeas, setup])

  const copySummary = async () => {
    setCopyMsg(null)
    const text = buildSummaryText({
      setup,
      faceShape,
      prompt,
      selectedStylePill,
      ideas: resultIdeas,
    })
    try {
      await navigator.clipboard.writeText(text)
      setCopyMsg('Copied to clipboard.')
    } catch {
      setCopyMsg('Copy failed—select and copy manually.')
    }
  }

  const save = async () => {
    setSaveMsg(null)
    if (!isSupabaseConfigured || !supabase) {
      setSaveMsg(supabaseSaveDisabledMessage() ?? 'Cloud save is not available. Check web/.env and restart the dev server.')
      return
    }
    let { data: sessionData } = await supabase.auth.getSession()
    let uid = sessionData.session?.user?.id
    if (!uid) {
      const { error: anonErr } = await supabase.auth.signInAnonymously()
      if (anonErr) {
        setSaveMsg(`Sign-in failed: ${anonErr.message}`)
        return
      }
      sessionData = (await supabase.auth.getSession()).data
      uid = sessionData.session?.user?.id
    }
    if (!uid) {
      setSaveMsg(
        'No Supabase session. Use Continue as guest again with Anonymous sign-in enabled in your Supabase project.',
      )
      return
    }
    setSaving(true)
    try {
      let photoPath: string | null = null
      if (imageUri) {
        const blob = await fetch(imageUri).then((r) => r.blob())
        const ext = blob.type.includes('png') ? 'png' : 'jpg'
        const path = `${uid}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
          upsert: true,
          contentType: blob.type || 'image/jpeg',
        })
        if (upErr) throw upErr
        photoPath = path
      }

      const { error: insErr } = await supabase.from('style_sessions').insert({
        user_id: uid,
        occasion: setup.occasion,
        hair_length_pref: setup.hairLengthPref,
        hair_goal: setup.hairGoal,
        face_shape: faceShape,
        prompt,
        style_pill: selectedStylePill,
        ideas: resultIdeas,
        photo_storage_path: photoPath,
      })
      if (insErr) throw insErr
      setSaveMsg('Saved to your Supabase project.')
    } catch (e: unknown) {
      setSaveMsg(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen wide>
      <p className="ui-eyebrow">Results</p>
      <div className="ui-results-hero">
        <h2>Your Top Hairstyle Matches</h2>
        <p>
          Neutral recommendations • {faceShape ?? 'General'} face • Based on face shape, texture,
          lifestyle & occasion
        </p>
      </div>
      <h1 className="ui-title ui-title--follow">Ideas for you</h1>
      <p className="ui-body">A starting point to discuss with a stylist—not a prescription.</p>

      {imageUri ? (
        <OrbitGallery imageSrc={imageUri} label="Your uploaded look in a style ring" />
      ) : null}

      {isHairPreviewApiConfigured() ? (
        <p className="ui-hint" aria-live="polite">
          {previewBusy
            ? 'Generating hairstyle previews from your photo…'
            : previewMsg ?? 'Calling your preview API with this photo, face shape, and style notes.'}
        </p>
      ) : (
        <p className="ui-hint">
          Optional: set <code>VITE_HAIR_PREVIEW_API_URL</code> to a backend that returns{' '}
          <code>{'{ images: ["https://..."] }'}</code> so each idea card can show a generated image.
        </p>
      )}

      <CardList>
        {resultIdeas.map((idea, index) => (
          <Card
            key={`${idea.title}-${index}`}
            title={idea.title}
            description={idea.description}
            imageUrl={idea.imageUrl}
            confidence={STYLE_META[index % STYLE_META.length].confidence}
            tags={STYLE_META[index % STYLE_META.length].tags}
            maintenanceLevel={STYLE_META[index % STYLE_META.length].maintenance}
            dailyStyling={STYLE_META[index % STYLE_META.length].time}
          />
        ))}
      </CardList>

      <div className="ui-status" aria-live="polite">
        {saveMsg ? <p role="status">{saveMsg}</p> : null}
        {copyMsg ? <p role="status">{copyMsg}</p> : null}
      </div>

      <div className="ui-actions-row">
        <Button variant="ghost" onClick={copySummary}>
          Copy summary
        </Button>
        <Button
          variant="primary"
          onClick={save}
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? 'Saving…' : 'Save session'}
        </Button>
      </div>

      <p className="ui-disclaimer">
        Saving uploads your photo to Storage and inserts a row in <code>style_sessions</code> when
        your Supabase project is configured and RLS allows it.
      </p>
    </Screen>
  )
}
