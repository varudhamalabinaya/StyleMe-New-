import type { NavigateFunction } from 'react-router-dom'
import type { FaceShapeLabel } from './faceShapeMock'
import { buildStyleIdeas } from './styleIdeas'
import { paths } from '../routes/paths'
import type { StyleIdea } from '../types/wizard'

type Args = {
  navigate: NavigateFunction
  faceShape: string | null
  setup: {
    gender: string
    occasion: string
    hairLengthPref: string
    hairGoal: string
  }
  prompt: string
  selectedStylePill: string | null
  setResultIdeas: (ideas: StyleIdea[]) => void
}

export function commitPromptToResult({
  navigate,
  faceShape,
  setup,
  prompt,
  selectedStylePill,
  setResultIdeas,
}: Args) {
  if (!faceShape) return
  const ideas = buildStyleIdeas({
    faceShape: faceShape as FaceShapeLabel,
    setup,
    prompt,
    selectedStylePill,
  })
  setResultIdeas(ideas)
  navigate(paths.result)
}
