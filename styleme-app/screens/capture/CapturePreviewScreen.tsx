import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import { useWizard } from '../../context/WizardContext'
import { detectFaceShapeFromPhoto } from '../../lib/faceShape'
import { theme } from '../../lib/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'CapturePreview'>

export default function CapturePreviewScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { photoUri } = useWizard()
  const [analyzing, setAnalyzing] = useState(false)

  async function analyzePhoto() {
    if (!photoUri) return
    setAnalyzing(true)
    try {
      const result = await detectFaceShapeFromPhoto(photoUri)
      navigation.navigate('FaceShapeReveal', {
        photoUri,
        shape: result.shape,
        confidence: result.confidence,
        fallback: result.fallback,
      })
    } catch (e) {
      Alert.alert('Analysis failed', e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setAnalyzing(false)
    }
  }

  function retake() {
    navigation.navigate('CaptureStep3')
  }

  if (!photoUri) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>No photo captured yet.</Text>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('CaptureStep1')}>
          <Text style={styles.primaryButtonText}>Go to capture</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      <Pressable
        style={[styles.closeButton, { top: insets.top + theme.space.md }]}
        onPress={() => navigation.navigate('SetupGoal')}
      >
        <Text style={styles.closeIcon}>×</Text>
      </Pressable>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 32) }]}>
        <View style={styles.metaBlock}>
          <Text style={styles.photoLabel}>Your photo</Text>
          <View style={styles.previewRow}>
            <Image source={{ uri: photoUri }} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.previewCopy}>
              <Text style={styles.looksGood}>Looks good?</Text>
              <Pressable onPress={retake} disabled={analyzing}>
                <Text style={styles.retakeLink}>Retake</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.primaryButton, analyzing && styles.primaryButtonDisabled]}
          disabled={analyzing}
          onPress={analyzePhoto}
        >
          {analyzing ? (
            <ActivityIndicator color={theme.sm.buttonPrimaryText} />
          ) : (
            <Text style={styles.primaryButtonText}>Use this photo</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.sm.pageBg,
    gap: theme.space.md,
    padding: theme.flow.screenPadding,
  },
  fallbackText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodyMd.fontSize,
    color: theme.sm.muted,
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
    gap: theme.space.lg,
    ...theme.shadow.lg,
  },
  metaBlock: {
    gap: theme.space.md,
  },
  photoLabel: {
    fontFamily: theme.font.bold,
    fontSize: 11,
    lineHeight: 13,
    color: theme.sm.textCaption,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: theme.sm.optionRadius,
    borderWidth: 1,
    borderColor: theme.sm.divider,
  },
  previewCopy: {
    gap: theme.space.xs,
  },
  looksGood: {
    fontFamily: theme.font.bold,
    fontSize: 20,
    lineHeight: 24,
    color: theme.sm.text,
  },
  retakeLink: {
    fontFamily: theme.font.body,
    fontSize: theme.type.setupSubtitle.fontSize,
    color: theme.sm.muted,
    textDecorationLine: 'underline',
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
})
