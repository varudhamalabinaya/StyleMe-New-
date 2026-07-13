/** Demo-only face shape heuristic. Used as fallback when vision API is off or fails. */

export const FACE_SHAPE_LABELS = ['Oval', 'Round', 'Square', 'Heart', 'Oblong'] as const

export type FaceShapeLabel = (typeof FACE_SHAPE_LABELS)[number]

export function isValidFaceShapeLabel(s: string): s is FaceShapeLabel {
  return (FACE_SHAPE_LABELS as readonly string[]).includes(s)
}

function simpleHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function mockFaceShapeFromImageUri(imageUri: string | null): FaceShapeLabel {
  if (!imageUri) return 'Oval'
  const idx = simpleHash(imageUri) % FACE_SHAPE_LABELS.length
  return FACE_SHAPE_LABELS[idx]!
}
