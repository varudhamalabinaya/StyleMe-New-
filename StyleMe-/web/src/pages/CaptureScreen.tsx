import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Screen } from '../components/ui/Screen'
import { useWizard } from '../context/useWizard'

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}

export function CaptureScreen() {
  const { imageUri, setImageUri } = useWizard()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const canUseCamera =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f || !f.type.startsWith('image/')) return
    const url = URL.createObjectURL(f)
    setImageUri(url)
  }

  const openCamera = async () => {
    setCameraError(null)
    if (!canUseCamera) {
      setCameraError('Camera is not available in this browser. Use upload instead.')
      return
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      setStream(s)
      setCameraOpen(true)
    } catch {
      setCameraError('Could not access the camera. Check permissions or use upload.')
    }
  }

  useEffect(() => {
    if (!cameraOpen || !stream || !videoRef.current) return
    videoRef.current.srcObject = stream
    void videoRef.current.play().catch(() => {})
  }, [cameraOpen, stream])

  const closeCamera = useCallback(() => {
    stopStream(stream)
    setStream(null)
    setCameraOpen(false)
  }, [stream])

  useEffect(() => () => stopStream(stream), [stream])

  useEffect(() => {
    if (!cameraOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCamera()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cameraOpen, closeCamera])

  const captureFrame = () => {
    const video = videoRef.current
    if (!video) return
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) return
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        setImageUri(url)
        closeCamera()
      },
      'image/jpeg',
      0.9,
    )
  }

  return (
    <Screen wide>
      <p className="ui-eyebrow">Photo</p>
      <h1 className="ui-title">Add a front-facing photo</h1>
      <p className="ui-body">
        Good light, hair off your face if possible. Photos are used only in this session for the
        demo unless you save to the cloud.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="visually-hidden"
        aria-label="Choose image file"
        tabIndex={-1}
        onChange={onFile}
      />

      <div className="ui-stack">
        <div className="ui-row">
          <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
            Choose from device
          </Button>
          <Button variant="ghost" onClick={openCamera}>
            Take a photo
          </Button>
        </div>
        {cameraError ? <p className="ui-disclaimer">{cameraError}</p> : null}

        {imageUri ? (
          <img src={imageUri} alt="Your selected photo" className="ui-preview ui-preview--centered" />
        ) : (
          <div className="ui-card ui-card--placeholder" role="status">
            No photo yet
          </div>
        )}

      </div>

      <p className="ui-disclaimer">
        Demo only: we do not provide medical or professional assessments. Do not upload photos you
        do not have rights to use.
      </p>

      {cameraOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Camera"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'grid',
            placeItems: 'center',
            padding: 'var(--space-md)',
            zIndex: 50,
          }}
        >
          <div
            className="ui-card"
            style={{ maxWidth: 480, width: '100%' }}
          >
            <div className="ui-stack">
              <video ref={videoRef} playsInline muted className="ui-preview" style={{ width: '100%', maxWidth: '100%' }} />
              <div className="ui-row">
                <Button variant="primary" onClick={captureFrame}>
                  Use photo
                </Button>
                <Button variant="ghost" onClick={closeCamera}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Screen>
  )
}
