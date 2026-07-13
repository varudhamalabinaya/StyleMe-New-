import { createContext } from 'react'
import type { WizardDraftV1 } from '../lib/wizard-storage'
import type { AuthMode, SetupState, StyleIdea } from '../types/wizard'

export type WizardContextValue = {
  authMode: AuthMode
  setGuest: () => Promise<void>
  setup: SetupState
  setSetup: (patch: Partial<SetupState>) => void
  imageUri: string | null
  setImageUri: (uri: string | null) => void
  faceShape: string | null
  setFaceShape: (shape: string | null) => void
  prompt: string
  setPrompt: (value: string) => void
  selectedStylePill: string | null
  setSelectedStylePill: (pill: string | null) => void
  resultIdeas: StyleIdea[]
  setResultIdeas: (ideas: StyleIdea[]) => void
  resetWizard: () => void
  needsPhotoReminder: boolean
  dismissPhotoBanner: () => void
  applyDraft: (draft: WizardDraftV1) => void
}

export const WizardContext = createContext<WizardContextValue | null>(null)
