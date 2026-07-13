/**
 * Face shape labels and geometry classifier (MediaPipe landmarks + ratio scoring).
 *
 * Mobile supports 7 labels. Web/backend still use 5 (Oval–Oblong) — expand there separately.
 * Pear is merged into Triangle: width ratios cannot split them reliably; jaw-angle is debug-only.
 * Score centers in REAL_WORLD_SHAPE_TARGETS are calibrated to real phone MediaPipe measurements
 * (ratio ~0.9 typical; Oblong outlier ~2.0), not legacy web/synthetic geometry (ratio ~1.3+).
 */

import {
  CLASSIFY_KEY_INDICES,
  FACE_SHAPE_DEBUG,
  logFaceShapeDebug,
  pickKeyPoints,
  type FaceShapeMeasurements,
  type FaceShapePitchZDepths,
} from './faceShapeDebug'

export const FACE_SHAPE_LABELS = [
  'Oval',
  'Round',
  'Square',
  'Heart',
  'Oblong',
  'Diamond',
  'Triangle',
] as const

export type FaceShapeLabel = (typeof FACE_SHAPE_LABELS)[number]

export function isValidFaceShapeLabel(s: string): s is FaceShapeLabel {
  return (FACE_SHAPE_LABELS as readonly string[]).includes(s)
}

export type Point = { x: number; y: number; z?: number }

function dist(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

function interiorAngleDeg(a: Point, vertex: Point, c: Point): number | null {
  const baX = a.x - vertex.x
  const baY = a.y - vertex.y
  const bcX = c.x - vertex.x
  const bcY = c.y - vertex.y
  const magBA = Math.hypot(baX, baY)
  const magBC = Math.hypot(bcX, bcY)
  if (magBA === 0 || magBC === 0) return null
  const cos = Math.max(-1, Math.min(1, (baX * bcX + baY * bcY) / (magBA * magBC)))
  return (Math.acos(cos) * 180) / Math.PI
}

function rotatePoint(p: Point, c: Point, angle: number): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const x = p.x - c.x
  const y = p.y - c.y
  return {
    x: x * cos - y * sin + c.x,
    y: x * sin + y * cos + c.y,
    z: p.z,
  }
}

function normalizeByEyeTilt(pts: Point[]): Point[] {
  const eyeL = pts[33]
  const eyeR = pts[263]
  if (!eyeL || !eyeR) return pts
  const angle = Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x)
  const center = { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 }
  return pts.map((p) => rotatePoint(p, center, -angle))
}

function zOf(p: Point | undefined): number {
  return p?.z ?? 0
}

/** Rotate in the y–z plane around the x-axis through pivot (undo head pitch). */
function rotatePitchXAxis(p: Point, pivot: Point, angleRad: number): Point {
  const y = p.y - pivot.y
  const z = zOf(p) - zOf(pivot)
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  return {
    x: p.x,
    y: y * cos - z * sin + pivot.y,
    z: y * sin + z * cos + zOf(pivot),
  }
}

type PitchNormalization = {
  points: Point[]
  pitchAngleDeg: number | null
  zDepths: FaceShapePitchZDepths | null
}

/**
 * Estimate head pitch from forehead vs chin z-depth (MediaPipe y–z midline tilt),
 * then rotate landmarks to a front-on pose before 2D width/length measurements.
 * Applied after roll correction; does not replace it.
 */
function normalizeByPitch(pts: Point[]): PitchNormalization {
  const eyeL = pts[33]
  const eyeR = pts[263]
  const top = pts[10]
  const chin = pts[152]
  const foreheadL = pts[103]
  const foreheadR = pts[332]

  if (!eyeL || !eyeR || !top || !chin) {
    return { points: pts, pitchAngleDeg: null, zDepths: null }
  }

  const pivot: Point = {
    x: (eyeL.x + eyeR.x) / 2,
    y: (eyeL.y + eyeR.y) / 2,
    z: (zOf(eyeL) + zOf(eyeR)) / 2,
  }

  const foreheadAvgZ =
    foreheadL && foreheadR ? (zOf(foreheadL) + zOf(foreheadR)) / 2 : zOf(top)
  const zDepths: FaceShapePitchZDepths = {
    eyeMid: zOf(pivot),
    forehead10: zOf(top),
    forehead103: zOf(foreheadL),
    forehead332: zOf(foreheadR),
    foreheadAvg: foreheadAvgZ,
    chin152: zOf(chin),
    chinMinusForeheadZ: zOf(chin) - foreheadAvgZ,
  }

  // Midline tilt in y–z: forehead band → chin (positive pitch ≈ chin farther / chin-down in depth).
  const foreY = foreheadL && foreheadR ? (foreheadL.y + foreheadR.y) / 2 : top.y
  const foreZ = foreheadAvgZ
  const dy = chin.y - foreY
  const dz = zOf(chin) - foreZ

  if (Math.abs(dy) < 1e-6 && Math.abs(dz) < 1e-6) {
    return { points: pts, pitchAngleDeg: 0, zDepths }
  }

  const pitchRad = Math.atan2(dz, dy)
  const pitchAngleDeg = (pitchRad * 180) / Math.PI
  const corrected = pts.map((p) => rotatePitchXAxis(p, pivot, -pitchRad))

  return { points: corrected, pitchAngleDeg, zDepths }
}

function confidenceFromScores(scores: Record<FaceShapeLabel, number>, picked: FaceShapeLabel): number {
  const vals = Object.values(scores).sort((a, b) => b - a)
  const top = vals[0] ?? 0
  const second = vals[1] ?? 0
  const margin = Math.max(0, top - second)
  const pickedScore = Math.max(0, Math.min(1, scores[picked] ?? 0))
  return Math.max(0.45, Math.min(0.94, 0.65 * pickedScore + 0.35 * (0.5 + margin / 2)))
}

/** Score centers calibrated from real MediaPipe phone photos (ratio ~0.9 typical, not web synthetic ~1.3+). */
export type ShapeScoreTargets = {
  ratio: number
  jawRel?: number
  foreheadRel?: number
  cheekVsJaw?: number
  cheekVsForehead?: number
  cheekDominance?: number
  /** foreheadRel − jawRel; positive = wider forehead (Heart), negative = wider jaw (Triangle). */
  foreheadJawGap?: number
  wRatio: number
  wJawRel?: number
  wForeheadRel?: number
  wCheekVsJaw?: number
  wCheekVsForehead?: number
  wCheekDominance?: number
  wForeheadJawGap?: number
}

const REAL_WORLD_SHAPE_TARGETS: Record<FaceShapeLabel, ShapeScoreTargets> = {
  Oval: {
    ratio: 0.915,
    jawRel: 0.765,
    foreheadRel: 0.772,
    cheekVsJaw: 0.225,
    cheekVsForehead: 0.218,
    wRatio: 1.85,
    wJawRel: 1.65,
    wForeheadRel: 1.55,
    wCheekVsJaw: 1.35,
    wCheekVsForehead: 1.35,
  },
  Round: {
    ratio: 0.905,
    jawRel: 0.83,
    foreheadRel: 0.815,
    cheekVsJaw: 0.08,
    cheekVsForehead: 0.07,
    wRatio: 1.65,
    wJawRel: 1.45,
    wForeheadRel: 1.25,
    wCheekVsJaw: 1.75,
    wCheekVsForehead: 1.45,
  },
  Square: {
    ratio: 0.908,
    jawRel: 0.796,
    foreheadRel: 0.768,
    cheekVsJaw: 0.19,
    cheekVsForehead: 0.17,
    foreheadJawGap: -0.028,
    wRatio: 1.45,
    wJawRel: 2.05,
    wForeheadRel: 1.65,
    wCheekVsJaw: 1.55,
    wCheekVsForehead: 1.35,
    wForeheadJawGap: 2.05,
  },
  Heart: {
    ratio: 0.912,
    jawRel: 0.748,
    foreheadRel: 0.785,
    cheekVsJaw: 0.24,
    cheekVsForehead: 0.22,
    foreheadJawGap: 0.035,
    wRatio: 1.15,
    wJawRel: 1.65,
    wForeheadRel: 1.85,
    wCheekVsJaw: 1.15,
    wCheekVsForehead: 1.35,
    wForeheadJawGap: 2.35,
  },
  Oblong: {
    ratio: 1.75,
    jawRel: 0.84,
    foreheadRel: 0.68,
    cheekVsJaw: 0.14,
    cheekVsForehead: 0.31,
    wRatio: 2.85,
    wJawRel: 0.9,
    wForeheadRel: 1.15,
    wCheekVsJaw: 0.7,
    wCheekVsForehead: 1.15,
  },
  Diamond: {
    ratio: 0.945,
    jawRel: 0.775,
    foreheadRel: 0.735,
    cheekDominance: 0.262,
    foreheadJawGap: -0.035,
    wRatio: 1.25,
    wJawRel: 1.35,
    wForeheadRel: 1.75,
    wCheekDominance: 2.05,
    wForeheadJawGap: 1.45,
  },
  Triangle: {
    ratio: 0.918,
    jawRel: 0.855,
    foreheadRel: 0.655,
    cheekVsJaw: 0.15,
    cheekVsForehead: 0.32,
    foreheadJawGap: -0.2,
    wRatio: 1.2,
    wJawRel: 1.85,
    wForeheadRel: 2.05,
    wCheekVsJaw: 1.05,
    wCheekVsForehead: 1.75,
    wForeheadJawGap: 2.15,
  },
}

function scoreShape(
  m: Pick<
    FaceShapeMeasurements,
    'ratio' | 'jawRel' | 'foreheadRel' | 'cheekVsJaw' | 'cheekVsForehead' | 'cheekDominance'
  >,
  t: ShapeScoreTargets,
): number {
  let penalty = Math.abs(m.ratio - t.ratio) * t.wRatio
  if (t.jawRel != null && t.wJawRel != null) penalty += Math.abs(m.jawRel - t.jawRel) * t.wJawRel
  if (t.foreheadRel != null && t.wForeheadRel != null) {
    penalty += Math.abs(m.foreheadRel - t.foreheadRel) * t.wForeheadRel
  }
  if (t.cheekVsJaw != null && t.wCheekVsJaw != null) {
    penalty += Math.abs(m.cheekVsJaw - t.cheekVsJaw) * t.wCheekVsJaw
  }
  if (t.cheekVsForehead != null && t.wCheekVsForehead != null) {
    penalty += Math.abs(m.cheekVsForehead - t.cheekVsForehead) * t.wCheekVsForehead
  }
  if (t.cheekDominance != null && t.wCheekDominance != null) {
    penalty += Math.abs(m.cheekDominance - t.cheekDominance) * t.wCheekDominance
  }
  if (t.foreheadJawGap != null && t.wForeheadJawGap != null) {
    penalty += Math.abs(m.foreheadRel - m.jawRel - t.foreheadJawGap) * t.wForeheadJawGap
  }
  return 1 - penalty
}

/** Classify from precomputed measurements (used by tests and real-log replay). */
export function classifyFromMeasurements(measurements: FaceShapeMeasurements): {
  shape: FaceShapeLabel
  confidence: number
  scores: Record<FaceShapeLabel, number>
} {
  const scores = Object.fromEntries(
    FACE_SHAPE_LABELS.map((label) => [label, scoreShape(measurements, REAL_WORLD_SHAPE_TARGETS[label])]),
  ) as Record<FaceShapeLabel, number>
  const picked = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Oval') as FaceShapeLabel
  return { shape: picked, confidence: confidenceFromScores(scores, picked), scores }
}

function computeMeasurements(pts: Point[]): FaceShapeMeasurements | null {
  const top = pts[10]
  const chin = pts[152]
  const cheekL = pts[234]
  const cheekR = pts[454]
  const jawL = pts[172]
  const jawR = pts[397]
  const foreheadL = pts[103]
  const foreheadR = pts[332]
  const jawContourL = pts[136]
  const jawContourR = pts[365]

  if (!top || !chin || !cheekL || !cheekR || !jawL || !jawR || !foreheadL || !foreheadR) {
    return null
  }

  const widthCheek = dist(cheekL, cheekR)
  const widthJaw = dist(jawL, jawR)
  const widthForehead = dist(foreheadL, foreheadR)
  const faceLength = dist(top, chin)
  const cheekVsJaw = Math.abs(widthCheek - widthJaw) / (widthCheek || 1)
  const cheekVsForehead = Math.abs(widthCheek - widthForehead) / (widthCheek || 1)

  const leftAngle = jawContourL ? interiorAngleDeg(chin, jawL, jawContourL) : null
  const rightAngle = jawContourR ? interiorAngleDeg(chin, jawR, jawContourR) : null
  const jawCornerAngleDeg =
    leftAngle != null && rightAngle != null ? (leftAngle + rightAngle) / 2 : leftAngle ?? rightAngle

  return {
    widthCheek,
    widthJaw,
    widthForehead,
    faceLength,
    ratio: faceLength / (widthCheek || 1),
    jawRel: widthJaw / (widthCheek || 1),
    foreheadRel: widthForehead / (widthCheek || 1),
    cheekVsJaw,
    cheekVsForehead,
    cheekDominance: Math.max(cheekVsJaw, cheekVsForehead),
    jawCornerAngleDeg,
  }
}

/** Ported from StyleMe web faceShapeLocal.ts classifyShape(), extended with Diamond + Triangle. */
export function classifyShape(rawPts: Point[]): { shape: FaceShapeLabel; confidence: number } {
  const afterRoll = normalizeByEyeTilt(rawPts)
  const measurementsBeforePitch = computeMeasurements(afterRoll)
  const { points: afterPitch, pitchAngleDeg, zDepths } = normalizeByPitch(afterRoll)
  const measurements = computeMeasurements(afterPitch)

  if (!measurements) {
    if (FACE_SHAPE_DEBUG) {
      logFaceShapeDebug('classifyShape:missing-key-landmarks', {
        landmarkCount: rawPts.length,
        path: 'insufficient-landmarks',
        fallback: true,
        rawKeyPoints: pickKeyPoints(rawPts, CLASSIFY_KEY_INDICES),
        normalizedKeyPoints: pickKeyPoints(afterRoll, CLASSIFY_KEY_INDICES),
        pitchCorrectedKeyPoints: pickKeyPoints(afterPitch, CLASSIFY_KEY_INDICES),
        pitchAngleDeg,
        zDepths: zDepths ?? undefined,
        measurementsBeforePitch: measurementsBeforePitch ?? undefined,
        shape: 'Oval',
        confidence: 0.35,
      })
    }
    return { shape: 'Oval', confidence: 0.35 }
  }

  const { shape: picked, confidence, scores } = classifyFromMeasurements(measurements)

  if (FACE_SHAPE_DEBUG) {
    logFaceShapeDebug('classifyShape:result', {
      landmarkCount: rawPts.length,
      path: 'classified',
      fallback: false,
      rawKeyPoints: pickKeyPoints(rawPts, CLASSIFY_KEY_INDICES),
      normalizedKeyPoints: pickKeyPoints(afterRoll, CLASSIFY_KEY_INDICES),
      pitchCorrectedKeyPoints: pickKeyPoints(afterPitch, CLASSIFY_KEY_INDICES),
      pitchAngleDeg,
      zDepths: zDepths ?? undefined,
      measurementsBeforePitch: measurementsBeforePitch ?? undefined,
      measurements,
      scores,
      shape: picked,
      confidence,
    })
  }

  return { shape: picked, confidence }
}

export function detectFaceShapeFromLandmarks(points: Point[]): {
  shape: FaceShapeLabel
  confidence: number
  fallback: boolean
} {
  if (!points || points.length < 455) {
    if (FACE_SHAPE_DEBUG) {
      logFaceShapeDebug('detectFaceShapeFromLandmarks:insufficient-count', {
        landmarkCount: points?.length ?? 0,
        path: 'insufficient-landmarks',
        fallback: true,
        rawKeyPoints: pickKeyPoints(points ?? [], CLASSIFY_KEY_INDICES),
        normalizedKeyPoints: {},
        shape: 'Oval',
        confidence: 0.35,
      })
    }
    return { shape: 'Oval', confidence: 0.35, fallback: true }
  }
  const { shape, confidence } = classifyShape(points)
  return { shape, confidence, fallback: false }
}

export async function detectFaceShapeFromPhoto(
  imageUri: string | null,
): Promise<{ shape: FaceShapeLabel; confidence: number; fallback: boolean }> {
  if (!imageUri) {
    if (FACE_SHAPE_DEBUG) {
      logFaceShapeDebug('detectFaceShapeFromPhoto:no-image', {
        landmarkCount: 0,
        imageUri: imageUri ?? undefined,
        path: 'no-image',
        fallback: true,
        rawKeyPoints: {},
        normalizedKeyPoints: {},
        shape: 'Oval',
        confidence: 0.3,
      })
    }
    return { shape: 'Oval', confidence: 0.3, fallback: true }
  }

  try {
    const { detectFaceLandmarksFromPhoto } = await import('./faceLandmarks')
    const { points, width, height } = await detectFaceLandmarksFromPhoto(imageUri)

    if (FACE_SHAPE_DEBUG) {
      logFaceShapeDebug('detectFaceShapeFromPhoto:after-native', {
        landmarkCount: points.length,
        imageUri,
        imageSize: { width, height },
        path: points.length < 455 ? 'insufficient-landmarks' : 'native',
        fallback: points.length < 455,
        rawKeyPoints: pickKeyPoints(points, CLASSIFY_KEY_INDICES),
        normalizedKeyPoints: {},
      })
    }

    return detectFaceShapeFromLandmarks(points)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[FaceShapeDebug] detectFaceShapeFromPhoto:native-error', error)
    if (FACE_SHAPE_DEBUG) {
      logFaceShapeDebug('detectFaceShapeFromPhoto:native-error', {
        landmarkCount: 0,
        imageUri,
        path: 'native-error',
        fallback: true,
        rawKeyPoints: {},
        normalizedKeyPoints: {},
        shape: 'Oval',
        confidence: 0.35,
        error: message,
      })
    }
    return { shape: 'Oval', confidence: 0.35, fallback: true }
  }
}
