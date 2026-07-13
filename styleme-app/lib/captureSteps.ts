/** Guided coaching copy for the live camera capture flow. */

export type CaptureCoachStep = {
  overlay: string
  title: string
  primaryLabel?: string
}

export const CAPTURE_COACH_STEPS: readonly CaptureCoachStep[] = [
  {
    overlay: 'Center your face in the frame',
    title: 'Find an area with good lighting',
  },
  {
    overlay: 'Center your face in the frame',
    title: 'Look straight into the camera',
  },
  {
    overlay: 'Center your face in the frame',
    title: 'Hold still while we scan',
    primaryLabel: 'Take photo',
  },
] as const
