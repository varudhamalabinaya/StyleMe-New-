import { Component, useEffect, useRef, useState, type ElementRef, type ReactNode } from 'react'

import {

  ActivityIndicator,

  Alert,

  Pressable,

  StyleSheet,

  Text,

  View,

} from 'react-native'

import { requireOptionalNativeModule } from 'expo-modules-core'

import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { NavigationProp } from '@react-navigation/native'

import type { RootStackParamList } from '../../navigation/AppNavigator'

import { useWizard } from '../../context/WizardContext'

import { requestGalleryPhoto, requestSystemCameraPhoto } from '../../lib/capturePhoto'

import { CAPTURE_COACH_STEPS } from '../../lib/captureSteps'

import { theme } from '../../lib/theme'



type CameraModule = typeof import('expo-camera')

type CameraViewRef = ElementRef<CameraModule['CameraView']>



type CaptureCoachScreenProps = {

  stepIndex: 0 | 1 | 2

  navigation: NavigationProp<RootStackParamList>

  onClose: () => void

  onAdvance: () => void

}



type CameraRuntime =

  | { status: 'loading' }

  | { status: 'error'; message: string }

  | { status: 'ready'; module: CameraModule }



export default function CaptureCoachScreen(props: CaptureCoachScreenProps) {

  const [runtime, setRuntime] = useState<CameraRuntime>({ status: 'loading' })



  useEffect(() => {

    let active = true



    async function loadCameraModule() {

      try {

        const native = requireOptionalNativeModule('ExpoCamera')

        // #region agent log

        fetch('http://127.0.0.1:7581/ingest/978b9440-4ce2-4785-8f24-c8ce0542f3cb', {

          method: 'POST',

          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'adbeae' },

          body: JSON.stringify({

            sessionId: 'adbeae',

            runId: 'pre-fix',

            hypothesisId: 'A',

            location: 'CaptureCoachScreen.tsx:loadCameraModule',

            message: 'ExpoCamera native probe',

            data: { nativeAvailable: Boolean(native) },

            timestamp: Date.now(),

          }),

        }).catch(() => {})

        // #endregion

        console.log('[CaptureDebug] ExpoCamera native probe', { available: Boolean(native) })



        if (!native) {

          if (!active) return

          setRuntime({

            status: 'error',

            message:

              'ExpoCamera native module not in this dev build. Run npx expo run:android --device to enable live preview.',

          })

          return

        }



        const module = await import('expo-camera')

        if (!active) return

        console.log('[CaptureDebug] expo-camera JS module loaded')

        setRuntime({ status: 'ready', module })

      } catch (error: unknown) {

        if (!active) return

        const message = error instanceof Error ? error.message : 'Camera unavailable'

        // #region agent log

        fetch('http://127.0.0.1:7581/ingest/978b9440-4ce2-4785-8f24-c8ce0542f3cb', {

          method: 'POST',

          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'adbeae' },

          body: JSON.stringify({

            sessionId: 'adbeae',

            runId: 'pre-fix',

            hypothesisId: 'B',

            location: 'CaptureCoachScreen.tsx:loadCameraModule',

            message: 'camera module load failed',

            data: { message },

            timestamp: Date.now(),

          }),

        }).catch(() => {})

        // #endregion

        console.log('[CaptureDebug] expo-camera import failed', { message })

        setRuntime({ status: 'error', message })

      }

    }



    void loadCameraModule()



    return () => {

      active = false

    }

  }, [])



  if (runtime.status === 'loading') {

    return (

      <CaptureCoachChrome

        stepIndex={props.stepIndex}

        onClose={props.onClose}

        preview={

          <View style={styles.previewLoading}>

            <ActivityIndicator color="#ffffff" size="large" />

          </View>

        }

        primaryLabel="Loading camera..."

        primaryDisabled

        onPrimaryPress={() => {}}

        onGalleryPress={() => {}}

      />

    )

  }



  if (runtime.status === 'error') {

    return <CaptureCoachDegraded {...props} reason={runtime.message} />

  }



  return <CaptureCoachLiveCamera {...props} camera={runtime.module} />

}



type SharedCoachProps = CaptureCoachScreenProps



function CaptureCoachLiveCamera({

  stepIndex,

  navigation,

  onClose,

  onAdvance,

  camera,

}: SharedCoachProps & { camera: CameraModule }) {

  const { CameraView, useCameraPermissions } = camera

  const insets = useSafeAreaInsets()

  const { setPhotoUri } = useWizard()

  const cameraRef = useRef<CameraViewRef>(null)

  const [permission, requestPermission] = useCameraPermissions()

  const [cameraReady, setCameraReady] = useState(false)

  const [capturing, setCapturing] = useState(false)

  const [previewBroken, setPreviewBroken] = useState(false)

  const permissionRequestedRef = useRef(false)



  const coachStep = CAPTURE_COACH_STEPS[stepIndex]

  useEffect(() => {

    // #region agent log

    fetch('http://127.0.0.1:7581/ingest/978b9440-4ce2-4785-8f24-c8ce0542f3cb', {

      method: 'POST',

      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'adbeae' },

      body: JSON.stringify({

        sessionId: 'adbeae',

        runId: 'pre-fix',

        hypothesisId: 'C',

        location: 'CaptureCoachScreen.tsx:CaptureCoachLiveCamera',

        message: 'live camera path mounted',

        data: { stepIndex },

        timestamp: Date.now(),

      }),

    }).catch(() => {})

    // #endregion

  }, [stepIndex])

  const isLastStep = stepIndex === CAPTURE_COACH_STEPS.length - 1

  const primaryLabel = coachStep.primaryLabel ?? 'Next'



  useEffect(() => {

    if (!permission || permissionRequestedRef.current) return

    if (!permission.granted && permission.canAskAgain) {

      permissionRequestedRef.current = true

      console.log('[CaptureDebug] requesting camera permission on mount', {

        status: permission.status,

      })

      void requestPermission().then((result) => {

        console.log('[CaptureDebug] camera permission result', {

          granted: result.granted,

          status: result.status,

          canAskAgain: result.canAskAgain,

        })

      })

    }

  }, [permission, requestPermission])



  useEffect(() => {

    console.log('[CaptureDebug] permission state', {

      granted: permission?.granted,

      status: permission?.status,

      canAskAgain: permission?.canAskAgain,

      cameraReady,

      previewBroken,

    })

  }, [permission, cameraReady, previewBroken])



  async function pickFromGallery() {

    const uri = await requestGalleryPhoto()

    if (uri) {

      setPhotoUri(uri)

      navigation.navigate('CapturePreview')

    }

  }



  async function takePhotoFromLivePreview() {

    if (capturing) return



    if (!cameraRef.current || !cameraReady) {

      Alert.alert(

        'Camera starting',

        'Wait a moment for the live preview to load, then try again.',

      )

      return

    }



    setCapturing(true)

    try {

      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 })

      console.log('[CaptureDebug] live preview capture', { hasUri: Boolean(photo?.uri) })

      if (photo?.uri) {

        setPhotoUri(photo.uri)

        navigation.navigate('CapturePreview')

      } else {

        Alert.alert('Capture failed', 'No photo was returned. Try again or use the gallery.')

      }

    } catch (error) {

      const message = error instanceof Error ? error.message : 'Could not take photo.'

      console.log('[CaptureDebug] live preview capture error', { message })

      Alert.alert('Capture failed', message)

    } finally {

      setCapturing(false)

    }

  }



  async function takePhotoFallback() {

    const uri = await requestSystemCameraPhoto()

    if (uri) {

      setPhotoUri(uri)

      navigation.navigate('CapturePreview')

    }

  }



  function handlePrimaryAction() {

    if (isLastStep) {

      if (previewBroken || !permission?.granted) {

        void takePhotoFallback()

        return

      }

      void takePhotoFromLivePreview()

      return

    }

    onAdvance()

  }



  const showLivePreview = Boolean(permission?.granted) && !previewBroken



  const preview = !permission ? (

    <View style={styles.previewFallback}>

      <ActivityIndicator color="#ffffff" />

    </View>

  ) : showLivePreview ? (

    <CameraPreviewBoundary onBroken={() => setPreviewBroken(true)}>

      <CameraView

        ref={cameraRef}

        style={StyleSheet.absoluteFill}

        facing="front"

        onCameraReady={() => {

          console.log('[CaptureDebug] CameraView ready')

          setCameraReady(true)

        }}

      />

    </CameraPreviewBoundary>

  ) : (

    <View style={styles.previewFallback} />

  )



  const permissionOverlay =

    permission && !permission.granted ? (

      <View style={styles.permissionOverlay}>

        <Text style={styles.permissionTitle}>Camera access needed</Text>

        <Text style={styles.permissionBody}>

          Allow camera access to see the live preview behind this guide.

        </Text>

        <Pressable style={styles.permissionButton} onPress={() => void requestPermission()}>

          <Text style={styles.permissionButtonText}>Allow camera</Text>

        </Pressable>

      </View>

    ) : previewBroken ? (

      <View style={styles.permissionOverlay}>

        <Text style={styles.permissionTitle}>Live preview unavailable</Text>

        <Text style={styles.permissionBody}>

          Reinstall the dev build with `npx expo run:android` to enable the in-app camera preview.

          You can still take a photo with the system camera or pick from gallery.

        </Text>

      </View>

    ) : null



  return (

    <CaptureCoachChrome

      stepIndex={stepIndex}

      onClose={onClose}

      preview={preview}

      permissionOverlay={permissionOverlay}

      primaryLabel={primaryLabel}

      capturing={capturing}

      primaryDisabled={capturing || (isLastStep && showLivePreview && !cameraReady)}

      onPrimaryPress={handlePrimaryAction}

      onGalleryPress={pickFromGallery}

      insets={insets}

    />

  )

}



function CaptureCoachDegraded({ stepIndex, navigation, onClose, onAdvance, reason }: SharedCoachProps & { reason: string }) {

  const insets = useSafeAreaInsets()

  const { setPhotoUri } = useWizard()

  useEffect(() => {

    // #region agent log

    fetch('http://127.0.0.1:7581/ingest/978b9440-4ce2-4785-8f24-c8ce0542f3cb', {

      method: 'POST',

      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'adbeae' },

      body: JSON.stringify({

        sessionId: 'adbeae',

        runId: 'pre-fix',

        hypothesisId: 'A',

        location: 'CaptureCoachScreen.tsx:CaptureCoachDegraded',

        message: 'using degraded capture path (no live CameraView)',

        data: { stepIndex, reason },

        timestamp: Date.now(),

      }),

    }).catch(() => {})

    // #endregion

    console.log('[CaptureDebug] degraded capture path', { stepIndex, reason })

  }, [stepIndex, reason])

  const coachStep = CAPTURE_COACH_STEPS[stepIndex]

  const isLastStep = stepIndex === CAPTURE_COACH_STEPS.length - 1

  const primaryLabel = coachStep.primaryLabel ?? 'Next'



  async function pickFromGallery() {

    const uri = await requestGalleryPhoto()

    if (uri) {

      setPhotoUri(uri)

      navigation.navigate('CapturePreview')

    }

  }



  async function takePhotoFallback() {

    const uri = await requestSystemCameraPhoto()

    if (uri) {

      setPhotoUri(uri)

      navigation.navigate('CapturePreview')

    }

  }



  function handlePrimaryAction() {

    if (isLastStep) {

      void takePhotoFallback()

      return

    }

    onAdvance()

  }



  return (

    <CaptureCoachChrome

      stepIndex={stepIndex}

      onClose={onClose}

      preview={<View style={styles.previewFallback} />}

      permissionOverlay={

        <View style={styles.permissionOverlay}>

          <Text style={styles.permissionTitle}>Live preview unavailable</Text>

          <Text style={styles.permissionBody}>

            {reason} Run `npx expo run:android` on a connected phone to enable the in-app camera

            feed.

          </Text>

        </View>

      }

      primaryLabel={primaryLabel}

      capturing={false}

      primaryDisabled={false}

      onPrimaryPress={handlePrimaryAction}

      onGalleryPress={pickFromGallery}

      insets={insets}

    />

  )

}



type CaptureCoachChromeProps = {

  stepIndex: number

  onClose: () => void

  preview: ReactNode

  permissionOverlay?: ReactNode

  primaryLabel?: string

  capturing?: boolean

  primaryDisabled?: boolean

  onPrimaryPress?: () => void

  onGalleryPress?: () => void

  insets?: { top: number; bottom: number }

}



function CaptureCoachChrome({

  stepIndex,

  onClose,

  preview,

  permissionOverlay,

  primaryLabel = 'Next',

  capturing = false,

  primaryDisabled = false,

  onPrimaryPress,

  onGalleryPress,

  insets,

}: CaptureCoachChromeProps) {

  const safeInsets = useSafeAreaInsets()

  const topInset = insets?.top ?? safeInsets.top

  const bottomInset = insets?.bottom ?? safeInsets.bottom

  const coachStep = CAPTURE_COACH_STEPS[stepIndex]



  return (

    <View style={styles.container}>

      <View style={styles.previewLayer}>{preview}</View>



      <View style={styles.guideOverlay} pointerEvents="none">

        <Text style={styles.overlayText}>{coachStep.overlay}</Text>

        <View style={styles.tickNorth} />

        <View style={styles.tickSouth} />

        <View style={styles.tickEast} />

        <View style={styles.tickWest} />

        <View style={styles.faceOval} />

      </View>



      {permissionOverlay}



      <Pressable style={[styles.closeButton, { top: topInset + theme.space.md }]} onPress={onClose}>

        <Text style={styles.closeIcon}>×</Text>

      </Pressable>



      <View style={[styles.sheet, { paddingBottom: Math.max(bottomInset, 32) }]}>

        <View style={styles.metaBlock}>

          <Text style={styles.tipMeta}>

            Tip {stepIndex + 1} of {CAPTURE_COACH_STEPS.length}

          </Text>

          <View style={styles.stepDots}>

            {CAPTURE_COACH_STEPS.map((_, index) => (

              <View

                key={index}

                style={[styles.stepDot, index <= stepIndex && styles.stepDotActive]}

              />

            ))}

          </View>

        </View>



        <View style={styles.instructionRow}>

          <View style={styles.tipBadge}>

            <Text style={styles.tipBadgeText}>{stepIndex + 1}</Text>

          </View>

          <Text style={styles.sheetTitle}>{coachStep.title}</Text>

        </View>



        {onPrimaryPress ? (

          <Pressable

            style={[styles.primaryButton, primaryDisabled && styles.primaryButtonDisabled]}

            disabled={primaryDisabled}

            onPress={onPrimaryPress}

          >

            {capturing ? (

              <ActivityIndicator color={theme.sm.buttonPrimaryText} />

            ) : (

              <Text style={styles.primaryButtonText}>{primaryLabel}</Text>

            )}

          </Pressable>

        ) : null}



        {onGalleryPress ? (

          <Pressable style={styles.textLink} onPress={onGalleryPress}>

            <Text style={styles.textLinkLabel}>Choose from gallery</Text>

          </Pressable>

        ) : null}

      </View>

    </View>

  )

}



type CameraPreviewBoundaryProps = {

  children: ReactNode

  onBroken: () => void

}



type CameraPreviewBoundaryState = {

  hasError: boolean

}



class CameraPreviewBoundary extends Component<CameraPreviewBoundaryProps, CameraPreviewBoundaryState> {

  state: CameraPreviewBoundaryState = { hasError: false }



  static getDerivedStateFromError(): CameraPreviewBoundaryState {

    return { hasError: true }

  }



  componentDidCatch(error: Error) {

    console.log('[CaptureDebug] CameraView render failed', { message: error.message })

    this.props.onBroken()

  }



  render() {

    if (this.state.hasError) {

      return <View style={styles.previewFallback} />

    }

    return this.props.children

  }

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: '#000000',

  },

  previewLayer: {

    ...StyleSheet.absoluteFillObject,

    backgroundColor: '#000000',

  },

  previewFallback: {

    flex: 1,

    backgroundColor: '#000000',

  },

  previewLoading: {

    flex: 1,

    backgroundColor: '#000000',

    alignItems: 'center',

    justifyContent: 'center',

  },

  permissionOverlay: {

    ...StyleSheet.absoluteFillObject,

    backgroundColor: 'rgba(0, 0, 0, 0.55)',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: theme.flow.screenPadding,

    gap: theme.space.md,

  },

  permissionTitle: {

    fontFamily: theme.font.bold,

    fontSize: 20,

    color: '#ffffff',

    textAlign: 'center',

  },

  permissionBody: {

    fontFamily: theme.font.body,

    fontSize: 14,

    lineHeight: 20,

    color: 'rgba(255, 255, 255, 0.85)',

    textAlign: 'center',

  },

  permissionButton: {

    marginTop: theme.space.sm,

    backgroundColor: theme.sm.buttonPrimary,

    paddingHorizontal: theme.space.xl,

    paddingVertical: theme.space.md,

    borderRadius: theme.capture.primaryRadius,

  },

  permissionButtonText: {

    fontFamily: theme.font.bold,

    fontSize: theme.type.bodyMd.fontSize,

    color: theme.sm.buttonPrimaryText,

  },

  guideOverlay: {

    ...StyleSheet.absoluteFillObject,

    alignItems: 'center',

    justifyContent: 'center',

  },

  overlayText: {

    position: 'absolute',

    top: '28%',

    width: 280,

    fontFamily: theme.font.semibold,

    fontSize: 12,

    lineHeight: 15,

    color: '#ffffff',

    textAlign: 'center',

    textTransform: 'uppercase',

    letterSpacing: 0.4,

  },

  faceOval: {

    width: theme.capture.guideOvalWidth,

    height: theme.capture.guideOvalHeight,

    borderRadius: theme.capture.guideOvalWidth / 2,

    borderWidth: 2,

    borderColor: 'rgba(255, 255, 255, 0.85)',

    borderStyle: 'dashed',

  },

  tickNorth: {

    position: 'absolute',

    top: '22%',

    width: 12,

    height: 1,

    backgroundColor: '#ffffff',

  },

  tickSouth: {

    position: 'absolute',

    bottom: '32%',

    width: 12,

    height: 1,

    backgroundColor: '#ffffff',

  },

  tickEast: {

    position: 'absolute',

    right: '18%',

    top: '42%',

    width: 1,

    height: 12,

    backgroundColor: '#ffffff',

  },

  tickWest: {

    position: 'absolute',

    left: '18%',

    top: '42%',

    width: 1,

    height: 12,

    backgroundColor: '#ffffff',

  },

  closeButton: {

    position: 'absolute',

    right: theme.flow.screenPadding,

    width: theme.capture.closeSize,

    height: theme.capture.closeSize,

    borderRadius: theme.capture.closeSize / 2,

    borderWidth: 1,

    borderColor: '#ffffff',

    alignItems: 'center',

    justifyContent: 'center',

    zIndex: 2,

  },

  closeIcon: {

    fontSize: 22,

    lineHeight: 24,

    color: '#ffffff',

    marginTop: -2,

  },

  sheet: {

    position: 'absolute',

    left: 0,

    right: 0,

    bottom: 0,

    backgroundColor: theme.sm.cardBg,

    borderTopLeftRadius: theme.capture.sheetRadius,

    borderTopRightRadius: theme.capture.sheetRadius,

    paddingTop: theme.space.xl,

    paddingHorizontal: theme.flow.screenPadding,

    gap: theme.space.md,

    zIndex: 2,

    ...theme.shadow.lg,

  },

  metaBlock: {

    gap: theme.space.sm,

  },

  tipMeta: {

    fontFamily: theme.font.bold,

    fontSize: 11,

    lineHeight: 13,

    color: theme.sm.textCaption,

    textTransform: 'uppercase',

    letterSpacing: 0.4,

  },

  stepDots: {

    flexDirection: 'row',

    gap: 6,

  },

  stepDot: {

    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: theme.sm.divider,

  },

  stepDotActive: {

    backgroundColor: theme.sm.buttonPrimary,

    width: 8,

    height: 8,

    borderRadius: 4,

  },

  instructionRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: theme.space.md,

  },

  tipBadge: {

    width: theme.capture.tipBadgeSize,

    height: theme.capture.tipBadgeSize,

    borderRadius: 16,

    backgroundColor: theme.sm.buttonPrimary,

    alignItems: 'center',

    justifyContent: 'center',

  },

  tipBadgeText: {

    fontFamily: theme.font.extrabold,

    fontSize: 14,

    color: theme.sm.buttonPrimaryText,

  },

  sheetTitle: {

    flex: 1,

    fontFamily: theme.font.bold,

    fontSize: 18,

    lineHeight: 22,

    color: theme.sm.text,

  },

  primaryButton: {

    alignSelf: 'stretch',

    backgroundColor: theme.sm.buttonPrimary,

    height: theme.capture.primaryHeight,

    borderRadius: theme.capture.primaryRadius,

    alignItems: 'center',

    justifyContent: 'center',

  },

  primaryButtonDisabled: {

    opacity: 0.55,

  },

  primaryButtonText: {

    fontFamily: theme.font.bold,

    fontSize: theme.type.bodyMd.fontSize,

    color: theme.sm.buttonPrimaryText,

  },

  textLink: {

    alignItems: 'center',

    paddingVertical: theme.space.sm,

  },

  textLinkLabel: {

    fontFamily: theme.font.body,

    fontSize: theme.type.setupSubtitle.fontSize,

    color: theme.sm.textCaption,

    textDecorationLine: 'underline',

  },

})


