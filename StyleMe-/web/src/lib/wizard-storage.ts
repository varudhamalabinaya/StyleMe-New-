import type { SetupState, StyleIdea } from '../types/wizard'
import { paths } from '../routes/paths'

const STORAGE_KEY = 'styleme-wizard-v1'

export type WizardDraftV1 = {
  v: 1
  setup: SetupState
  prompt: string
  selectedStylePill: string | null
  faceShape: string | null
  resultIdeas: StyleIdea[]
  /** Last route pathname for resume hint */
  lastPath: string | null
  savedAt: string
}

export function loadDraft(): WizardDraftV1 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as WizardDraftV1
    if (data?.v !== 1 || !data.setup) return null
    return data
  } catch {
    return null
  }
}

export function saveDraft(partial: Omit<WizardDraftV1, 'v' | 'savedAt'> & { savedAt?: string }): void {
  const payload: WizardDraftV1 = {
    v: 1,
    setup: partial.setup,
    prompt: partial.prompt,
    selectedStylePill: partial.selectedStylePill,
    faceShape: partial.faceShape,
    resultIdeas: partial.resultIdeas,
    lastPath: partial.lastPath ?? null,
    savedAt: partial.savedAt ?? new Date().toISOString(),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* quota or private mode */
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function hasDraft(): boolean {
  return loadDraft() !== null
}

/** First step user should open after resume (photo always re-done in browser). */
export function getResumePath(draft: WizardDraftV1): string {
  const { setup } = draft
  const setupOk =
    setup.occasion.trim() && setup.hairLengthPref.trim() && setup.hairGoal.trim()
  if (!setupOk) return paths.setup
  return paths.capture
}
