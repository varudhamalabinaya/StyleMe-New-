import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { clearDraft } from '../lib/wizard-storage'
import type { WizardDraftV1 } from '../lib/wizard-storage'
import type { AuthMode, SetupState, StyleIdea } from '../types/wizard'
import { defaultSetup } from '../types/wizard'
import { supabase } from '../lib/supabase'
import { WizardContext } from './wizard-context'

export function WizardProvider({ children }: { children: ReactNode }) {
  const [authMode, setAuthMode] = useState<AuthMode>('unauthenticated')
  const [setup, setSetupState] = useState<SetupState>(defaultSetup)
  const [imageUri, setImageUriState] = useState<string | null>(null)
  const [faceShape, setFaceShape] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [selectedStylePill, setSelectedStylePill] = useState<string | null>(null)
  const [resultIdeas, setResultIdeas] = useState<StyleIdea[]>([])
  const [needsPhotoReminder, setNeedsPhotoReminder] = useState(false)

  const imageUriRef = useRef<string | null>(null)

  const setImageUri = useCallback((uri: string | null) => {
    if (imageUriRef.current && imageUriRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(imageUriRef.current)
    }
    imageUriRef.current = uri
    setImageUriState(uri)
    if (uri) {
      // New photo should trigger a fresh face-shape suggestion.
      setFaceShape(null)
      setNeedsPhotoReminder(false)
    }
  }, [])

  const setSetup = useCallback((patch: Partial<SetupState>) => {
    setSetupState((s) => ({ ...s, ...patch }))
  }, [])

  const dismissPhotoBanner = useCallback(() => {
    setNeedsPhotoReminder(false)
  }, [])

  const applyDraft = useCallback((draft: WizardDraftV1) => {
    setSetupState(draft.setup)
    setPrompt(draft.prompt)
    setSelectedStylePill(draft.selectedStylePill)
    setFaceShape(draft.faceShape)
    setResultIdeas(draft.resultIdeas ?? [])
    setNeedsPhotoReminder(true)
  }, [])

  const setGuest = useCallback(async () => {
    if (supabase) {
      let {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        const signRes = await supabase.auth.signInAnonymously()
        if (signRes.error) {
          throw new Error(signRes.error.message)
        }
        const afterSign = await supabase.auth.getSession()
        session = afterSign.data.session
      }
      if (!session) {
        throw new Error(
          'No Supabase session after anonymous sign-in. In the Supabase dashboard, enable Authentication → Sign In / Providers → Anonymous.',
        )
      }
    }
    setAuthMode('guest')
  }, [])

  const resetWizard = useCallback(() => {
    if (imageUriRef.current && imageUriRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(imageUriRef.current)
    }
    imageUriRef.current = null
    clearDraft()
    setAuthMode('unauthenticated')
    setSetupState(defaultSetup)
    setImageUriState(null)
    setFaceShape(null)
    setPrompt('')
    setSelectedStylePill(null)
    setResultIdeas([])
    setNeedsPhotoReminder(false)
  }, [])

  const value = useMemo(
    () => ({
      authMode,
      setGuest,
      setup,
      setSetup,
      imageUri,
      setImageUri,
      faceShape,
      setFaceShape,
      prompt,
      setPrompt,
      selectedStylePill,
      setSelectedStylePill,
      resultIdeas,
      setResultIdeas,
      resetWizard,
      needsPhotoReminder,
      dismissPhotoBanner,
      applyDraft,
    }),
    [
      authMode,
      setGuest,
      setup,
      setSetup,
      imageUri,
      setImageUri,
      faceShape,
      setFaceShape,
      prompt,
      setPrompt,
      selectedStylePill,
      setSelectedStylePill,
      resultIdeas,
      setResultIdeas,
      resetWizard,
      needsPhotoReminder,
      dismissPhotoBanner,
      applyDraft,
    ],
  )

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
}
