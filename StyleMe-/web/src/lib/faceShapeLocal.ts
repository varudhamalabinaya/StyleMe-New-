import type { FaceShapeLabel } from './faceShapeMock'
import { mockFaceShapeFromImageUri } from './faceShapeMock'

type Point = { x: number; y: number; z?: number }

type FaceLandmarkerLike = {
  detect(image: ImageBitmap): { faceLandmarks?: Point[][] }
}

let landmarkerPromise: Promise<FaceLandmarkerLike> | null = null

function dist(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
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
  // Outer eye corners; robust anchors for in-plane tilt.
  const eyeL = pts[33]
  const eyeR = pts[263]
  if (!eyeL || !eyeR) return pts
  const angle = Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x)
  const center = { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 }
  return pts.map((p) => rotatePoint(p, center, -angle))
}

function confidenceFromScores(scores: Record<FaceShapeLabel, number>, picked: FaceShapeLabel): number {
  const vals = Object.values(scores).sort((a, b) => b - a)
  const top = vals[0] ?? 0
  const second = vals[1] ?? 0
  const margin = Math.max(0, top - second)
  const pickedScore = Math.max(0, Math.min(1, scores[picked] ?? 0))
  // Blend model score and class separation margin.
  return Math.max(0.45, Math.min(0.94, 0.65 * pickedScore + 0.35 * (0.5 + margin / 2)))
}

function getLandmarker(): Promise<FaceLandmarkerLike> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      )
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
      })
    })()
  }
  return landmarkerPromise
}

function classifyShape(rawPts: Point[]): { shape: FaceShapeLabel; confidence: number } {
  const pts = normalizeByEyeTilt(rawPts)
  // Face mesh landmark indexes (MediaPipe canonical mesh).
  const top = pts[10]
  const chin = pts[152]
  const cheekL = pts[234]
  const cheekR = pts[454]
  const jawL = pts[172]
  const jawR = pts[397]
  const foreheadL = pts[103]
  const foreheadR = pts[332]

  if (!top || !chin || !cheekL || !cheekR || !jawL || !jawR || !foreheadL || !foreheadR) {
    return { shape: 'Oval', confidence: 0.35 }
  }

  const widthCheek = dist(cheekL, cheekR)
  const widthJaw = dist(jawL, jawR)
  const widthForehead = dist(foreheadL, foreheadR)
  const faceLength = dist(top, chin)

  const ratio = faceLength / (widthCheek || 1)
  const jawRel = widthJaw / (widthCheek || 1)
  const foreheadRel = widthForehead / (widthCheek || 1)

  const cheekVsJaw = Math.abs(widthCheek - widthJaw) / (widthCheek || 1)
  const cheekVsForehead = Math.abs(widthCheek - widthForehead) / (widthCheek || 1)

  // Score-based minimum viable classifier with tunable centers.
  const scores: Record<FaceShapeLabel, number> = {
    Oval:
      1 -
      (Math.abs(ratio - 1.46) * 1.45 +
        Math.abs(jawRel - 0.93) * 1.1 +
        Math.abs(foreheadRel - 0.98) * 1.0),
    Round:
      1 -
      (Math.abs(ratio - 1.28) * 1.7 +
        Math.abs(jawRel - 0.98) * 1.0 +
        Math.abs(cheekVsJaw - 0.02) * 1.4),
    Square:
      1 -
      (Math.abs(ratio - 1.4) * 1.4 +
        Math.abs(jawRel - 1.0) * 1.3 +
        Math.abs(cheekVsForehead - 0.02) * 1.3),
    Heart:
      1 -
      (Math.abs(ratio - 1.45) * 1.35 +
        Math.abs(foreheadRel - 1.06) * 1.5 +
        Math.abs(jawRel - 0.84) * 1.4),
    Oblong:
      1 -
      (Math.abs(ratio - 1.62) * 1.8 +
        Math.abs(jawRel - 0.9) * 1.0 +
        Math.abs(foreheadRel - 0.95) * 0.9),
  }

  const picked = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Oval') as FaceShapeLabel
  return { shape: picked, confidence: confidenceFromScores(scores, picked) }
}

async function imageUriToBitmap(imageUri: string): Promise<ImageBitmap> {
  const res = await fetch(imageUri)
  if (!res.ok) throw new Error('Could not read the selected photo.')
  const blob = await res.blob()
  return createImageBitmap(blob)
}

export async function detectFaceShapeLocal(
  imageUri: string | null,
): Promise<{ shape: FaceShapeLabel; confidence: number; fallback: boolean }> {
  if (!imageUri) return { shape: 'Oval', confidence: 0.3, fallback: true }

  try {
    const [landmarker, bitmap] = await Promise.all([getLandmarker(), imageUriToBitmap(imageUri)])
    try {
      const result = landmarker.detect(bitmap)
      const points = result.faceLandmarks?.[0]
      if (!points || points.length < 455) {
        return {
          shape: mockFaceShapeFromImageUri(imageUri),
          confidence: 0.35,
          fallback: true,
        }
      }
      const { shape, confidence } = classifyShape(points)
      return { shape, confidence, fallback: false }
    } finally {
      bitmap.close()
    }
  } catch {
    return {
      shape: mockFaceShapeFromImageUri(imageUri),
      confidence: 0.35,
      fallback: true,
    }
  }
}

