import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const urlRaw = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonRaw = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const url = urlRaw?.trim()
const anon = anonRaw?.trim()

/**
 * Why Save is disabled — null when env looks like a real Supabase project.
 * Vite only reads .env when the dev server (or build) starts; restart after edits.
 */
export function supabaseSaveDisabledMessage(): string | null {
  if (!url) {
    return 'Cloud save is off. In the web folder, copy .env.example to .env, set VITE_SUPABASE_URL to your project URL (https://….supabase.co), then restart npm run dev.'
  }
  if (!anon) {
    return 'Cloud save is off. Add VITE_SUPABASE_ANON_KEY to web/.env (Supabase → Settings → API → anon public key — the long JWT), then restart npm run dev.'
  }
  if (!url.startsWith('http')) {
    return 'VITE_SUPABASE_URL must start with https:// (your Supabase project URL).'
  }
  const anonLooksPlaceholder =
    anon.length <= 40 ||
    /your-anon|paste here|changeme|example/i.test(anon) ||
    anon === 'your-anon-jwt'
  const urlLooksExample = /your-project\.supabase\.co$/i.test(url.replace(/\/$/, ''))
  if (anonLooksPlaceholder || urlLooksExample) {
    return 'Replace the placeholder values in web/.env with your real Supabase URL and anon key from the dashboard, then restart npm run dev.'
  }
  if (anon.length <= 30 || anon.includes('paste')) {
    return 'VITE_SUPABASE_ANON_KEY must be the full anon JWT from Supabase (a long string starting with eyJ…), not a short placeholder.'
  }
  return null
}

/** True when both env vars look like real Supabase project values (not placeholders). */
export const isSupabaseConfigured = supabaseSaveDisabledMessage() === null

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
