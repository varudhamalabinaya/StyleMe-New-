import { requireNativeModule } from 'expo-modules-core'
import { CLASSIFY_KEY_INDICES, FACE_SHAPE_DEBUG, logFaceShapeDebug, pickKeyPoints } from './faceShapeDebug'
import type { Point } from './faceShape'

type LandmarkResult = {
  landmarks: Array<{ x: number; y: number; z: number }>
  width: number
  height: number
}

const FaceLandmarksNative = requireNativeModule<{
  detectFromImageAsync(imageUri: string): Promise<LandmarkResult>
}>('FaceLandmarks')

export type FaceLandmarkDetection = {
  points: Point[]
  width: number
  height: number
}

/** MediaPipe Face Landmarker (IMAGE mode) — single photo inference via native module. */
export async function detectFaceLandmarksFromPhoto(imageUri: string): Promise<FaceLandmarkDetection> {
  const result = await FaceLandmarksNative.detectFromImageAsync(imageUri)
  const points = result.landmarks.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z }))

  if (FACE_SHAPE_DEBUG) {
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    logFaceShapeDebug('faceLandmarks:native-result', {
      landmarkCount: points.length,
      imageUri,
      imageSize: { width: result.width, height: result.height },
      path: 'native',
      fallback: points.length < 455,
      rawKeyPoints: pickKeyPoints(points, CLASSIFY_KEY_INDICES),
      normalizedKeyPoints: {},
    })
    console.log('[FaceShapeDebug] faceLandmarks:native-stats', {
      landmarkCount: points.length,
      width: result.width,
      height: result.height,
      xMin: xs.length ? Math.min(...xs) : null,
      xMax: xs.length ? Math.max(...xs) : null,
      yMin: ys.length ? Math.min(...ys) : null,
      yMax: ys.length ? Math.max(...ys) : null,
      firstThree: points.slice(0, 3),
      keyIndices: pickKeyPoints(points, CLASSIFY_KEY_INDICES),
    })
  }

  if (points.length === 0) {
    console.warn(
      '[FaceShapeDebug] MediaPipe returned 0 landmarks — native module resolves empty list when no face is detected (not a thrown error).',
    )
  }

  return { points, width: result.width, height: result.height }
}
