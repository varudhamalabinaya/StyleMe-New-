/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** POST multipart: photo + context JSON; response { images?: string[] } | { urls?: string[] } */
  readonly VITE_HAIR_PREVIEW_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
