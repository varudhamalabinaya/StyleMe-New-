import type { FaceShapeLabel } from './faceShapeMock'
import type { SetupState, StyleIdea } from '../types/wizard'
import { recommendHairstyles } from './hairstyleRecommender'

export const STYLE_PILLS = [
  'Soft layers',
  'Bold color',
  'Low-maintenance',
  'Formal event',
  'Beachy texture',
  'Face-framing',
  'Sleek & polished',
  'Natural volume',
] as const

export function buildStyleIdeas(input: {
  faceShape: FaceShapeLabel
  setup: SetupState
  prompt: string
  selectedStylePill: string | null
}): StyleIdea[] {
  const { faceShape, setup, prompt, selectedStylePill } = input
  return recommendHairstyles(
    {
      faceShape,
      setup,
      prompt,
      selectedStylePill,
    },
    5,
  ).map((r) => ({
    title: r.title,
    description: r.description,
  }))
}
