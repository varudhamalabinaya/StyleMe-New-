import { requireNativeModule } from 'expo-modules-core'
import type { FaceLandmarkDetectionResult } from './types'

export default requireNativeModule<{
  detectFromImageAsync(imageUri: string): Promise<FaceLandmarkDetectionResult>
}>('FaceLandmarks')
