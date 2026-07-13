import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  defaultSetup,
  OTHER_OPTION,
  type SetupOtherDetails,
  type SetupState,
  type SetupStepKey,
} from '../lib/setupOptions'

export type FaceShapeResult = {
  photoUri: string
  shape: string
  confidence: number
  fallback: boolean
}

type WizardContextValue = {
  setup: SetupState
  setSetupField: (key: SetupStepKey, value: string) => void
  setSetupOtherDetail: (key: SetupStepKey, value: string) => void
  photoUri: string | null
  setPhotoUri: (uri: string | null) => void
  faceShape: FaceShapeResult | null
  setFaceShape: (result: FaceShapeResult | null) => void
  prompt: string
  setPrompt: (value: string) => void
  selectedStylePill: string | null
  setSelectedStylePill: (value: string | null) => void
  sessionId: string | null
  setSessionId: (value: string | null) => void
  generatedImageUrls: string[]
  setGeneratedImageUrls: (value: string[]) => void
  resetWizard: () => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [setup, setSetup] = useState<SetupState>(defaultSetup)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [faceShape, setFaceShape] = useState<FaceShapeResult | null>(null)
  const [prompt, setPrompt] = useState('')
  const [selectedStylePill, setSelectedStylePill] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([])

  const setSetupField = useCallback((key: SetupStepKey, value: string) => {
    setSetup((current) => ({
      ...current,
      [key]: value,
      otherDetails:
        value === OTHER_OPTION
          ? current.otherDetails
          : ({ ...current.otherDetails, [key]: '' } satisfies SetupOtherDetails),
    }))
  }, [])

  const setSetupOtherDetail = useCallback((key: SetupStepKey, value: string) => {
    setSetup((current) => ({
      ...current,
      otherDetails: { ...current.otherDetails, [key]: value },
    }))
  }, [])

  const resetWizard = useCallback(() => {
    setSetup(defaultSetup)
    setPhotoUri(null)
    setFaceShape(null)
    setPrompt('')
    setSelectedStylePill(null)
    setSessionId(null)
    setGeneratedImageUrls([])
  }, [])

  const value = useMemo(
    () => ({
      setup,
      setSetupField,
      setSetupOtherDetail,
      photoUri,
      setPhotoUri,
      faceShape,
      setFaceShape,
      prompt,
      setPrompt,
      selectedStylePill,
      setSelectedStylePill,
      sessionId,
      setSessionId,
      generatedImageUrls,
      setGeneratedImageUrls,
      resetWizard,
    }),
    [
      setup,
      setSetupField,
      setSetupOtherDetail,
      photoUri,
      faceShape,
      prompt,
      selectedStylePill,
      sessionId,
      generatedImageUrls,
      resetWizard,
    ],
  )

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext)
  if (!ctx) {
    throw new Error('useWizard must be used within WizardProvider')
  }
  return ctx
}
