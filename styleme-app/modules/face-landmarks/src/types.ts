export type FaceLandmarkPoint = {
  x: number
  y: number
  z: number
}

export type FaceLandmarkDetectionResult = {
  landmarks: FaceLandmarkPoint[]
  width: number
  height: number
}
