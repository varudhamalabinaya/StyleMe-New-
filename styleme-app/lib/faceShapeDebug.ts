import type { FaceShapeLabel, Point } from './faceShape'

/** Temporary — set false once face-shape pipeline is verified. */
export const FACE_SHAPE_DEBUG = true

/** Key mesh indices used by classifyShape(), plus jaw-contour points for debug. */
export const CLASSIFY_KEY_INDICES = [
  10, 33, 103, 136, 152, 172, 234, 263, 332, 365, 397, 454,
] as const

export type FaceShapeMeasurements = {
  widthCheek: number
  widthJaw: number
  widthForehead: number
  faceLength: number
  ratio: number
  jawRel: number
  foreheadRel: number
  cheekVsJaw: number
  cheekVsForehead: number
  cheekDominance: number
  /** Interior jaw-corner angle (152–172–136 / 152–397–365 avg). Debug/tuning only — Pear merged into Triangle. */
  jawCornerAngleDeg: number | null
}

export type FaceShapePitchZDepths = {
  eyeMid: number
  forehead10: number
  forehead103: number
  forehead332: number
  foreheadAvg: number
  chin152: number
  /** chin152.z − foreheadAvg — positive ⇒ chin farther from camera than forehead band. */
  chinMinusForeheadZ: number
}

export type FaceShapeDebugSnapshot = {
  landmarkCount: number
  imageUri?: string
  imageSize?: { width: number; height: number }
  path: 'native' | 'insufficient-landmarks' | 'no-image' | 'native-error' | 'classified'
  fallback: boolean
  rawKeyPoints: Record<number, Point | undefined>
  /** After roll (eye-tilt) correction only. */
  normalizedKeyPoints: Record<number, Point | undefined>
  /** After roll + pitch correction — used for final measurements. */
  pitchCorrectedKeyPoints?: Record<number, Point | undefined>
  pitchAngleDeg?: number | null
  zDepths?: FaceShapePitchZDepths
  measurementsBeforePitch?: FaceShapeMeasurements
  measurements?: FaceShapeMeasurements
  scores?: Record<FaceShapeLabel, number>
  shape?: FaceShapeLabel
  confidence?: number
  error?: string
}

export function logFaceShapeDebug(label: string, snapshot: FaceShapeDebugSnapshot): void {
  if (!FACE_SHAPE_DEBUG) return
  console.log(`[FaceShapeDebug] ${label}`, JSON.stringify(snapshot, null, 2))
}

export function pickKeyPoints(points: Point[], indices: readonly number[]): Record<number, Point | undefined> {
  return Object.fromEntries(indices.map((i) => [i, points[i]]))
}
