import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/ui/Screen'
import { useWizard } from '../context/useWizard'
import { detectFaceShapeLocal } from '../lib/faceShapeLocal'
import { paths } from '../routes/paths'

export function FaceShapeScreen() {
  const navigate = useNavigate()
  const { imageUri, faceShape, setFaceShape } = useWizard()
  const [loading, setLoading] = useState(false)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)

  useEffect(() => {
    if (!imageUri) {
      navigate(paths.capture, { replace: true })
      return
    }
    let cancelled = false
    if (!faceShape) {
      setLoading(true)
      void detectFaceShapeLocal(imageUri)
        .then((res) => {
          if (cancelled) return
          setFaceShape(res.shape)
          setConfidence(res.confidence)
          setUsedFallback(res.fallback)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }
    return () => {
      cancelled = true
    }
  }, [faceShape, imageUri, navigate, setFaceShape])

  if (!imageUri) {
    return null
  }

  return (
    <Screen>
      <p className="ui-eyebrow">Face shape</p>
      <h1 className="ui-title">Suggested face shape</h1>
      <div className="ui-shape-suggestion" aria-live="polite">
        <p className="ui-shape-suggestion-label">Detected</p>
        <p className="ui-shape-suggestion-value">
          {loading ? 'Analyzing photo...' : faceShape ?? 'Reading suggestion...'}
        </p>
        {confidence !== null ? (
          <p className="ui-disclaimer ui-disclaimer--tight">Confidence: {Math.round(confidence * 100)}%</p>
        ) : null}
      </div>

      <p className="ui-body">
        We estimate shape from local facial landmarks in your uploaded photo to tune hairstyle
        recommendations. This is style guidance only, not medical advice.
      </p>

      <p className="ui-disclaimer">
        {usedFallback
          ? 'Face landmarks were unavailable for this image, so we used a fallback estimate.'
          : 'This suggestion helps ranking only; your final style choice is always yours.'}
      </p>
    </Screen>
  )
}
