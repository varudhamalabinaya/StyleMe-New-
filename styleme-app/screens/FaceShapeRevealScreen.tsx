import { useEffect } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { FlowHeaderNav } from '../components/FlowHeaderNav'
import { useWizard } from '../context/WizardContext'
import { getFaceShapeDescription } from '../lib/faceShapeDescriptions'
import type { FaceShapeLabel } from '../lib/faceShape'
import { theme } from '../lib/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'FaceShapeReveal'>

function splitDescription(description: string): { headline: string; body: string } {
  const idx = description.indexOf('. ')
  if (idx === -1) return { headline: description, body: '' }
  return {
    headline: description.slice(0, idx + 1),
    body: description.slice(idx + 2),
  }
}

export default function FaceShapeRevealScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets()
  const { photoUri, shape, confidence, fallback } = route.params
  const { setFaceShape } = useWizard()
  const description = getFaceShapeDescription(shape as FaceShapeLabel)
  const { headline, body } = splitDescription(description)

  useEffect(() => {
    setFaceShape({ photoUri, shape, confidence, fallback })
  }, [photoUri, shape, confidence, fallback, setFaceShape])

  return (
    <View style={styles.container}>
      <FlowHeaderNav macroStep={3} />

      <Pressable style={styles.backLink} onPress={() => navigation.navigate('CapturePreview')}>
        <Text style={styles.backLinkText}>← Back</Text>
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Your face shape</Text>
          <View style={styles.revealBadge}>
            <Text style={styles.shapeName}>{shape.toUpperCase()}</Text>
          </View>
          <View style={styles.analysisBadge}>
            <View style={styles.analysisDot} />
            <Text style={styles.analysisText}>Detected via face analysis</Text>
          </View>
        </View>

        <View style={styles.descriptionCard}>
          <View style={styles.descriptionCopy}>
            <Text style={styles.descriptionHeadline}>{headline}</Text>
            {body ? <Text style={styles.descriptionBody}>{body}</Text> : null}
          </View>
          <Image source={{ uri: photoUri }} style={styles.userPhoto} resizeMode="cover" />
        </View>

        {fallback ? (
          <Text style={styles.fallbackNote}>
            Face landmarks were unavailable for this image, so we used a fallback estimate.
          </Text>
        ) : null}

        <Text style={styles.disclaimer}>Style guidance only - not medical advice.</Text>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(theme.flow.screenPadding, insets.bottom + theme.space.sm) },
        ]}
      >
        <Pressable style={styles.continueButton} onPress={() => navigation.navigate('StylePrompt')}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.sm.pageBg,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.flow.screenPadding,
    paddingBottom: theme.space.sm,
  },
  backLinkText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.setupSubtitle.fontSize,
    color: theme.sm.muted,
  },
  scroll: {
    flex: 1,
  },
  body: {
    paddingHorizontal: theme.flow.screenPadding,
    paddingTop: theme.space.lg,
    paddingBottom: theme.space.xl2,
    gap: theme.flow.sectionGap,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: theme.space.md,
    width: '100%',
  },
  eyebrow: {
    fontFamily: theme.font.bold,
    fontSize: 11,
    lineHeight: 13,
    color: theme.sm.textCaption,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  revealBadge: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 2,
    borderColor: theme.sm.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.sm.cardBg,
  },
  shapeName: {
    fontFamily: theme.font.extrabold,
    fontSize: 56,
    lineHeight: 68,
    color: theme.sm.text,
    textTransform: 'uppercase',
  },
  analysisBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    backgroundColor: theme.flow.analysisBadgeBg,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: theme.space.sm,
  },
  analysisDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.sm.buttonPrimary,
  },
  analysisText: {
    fontFamily: theme.font.body,
    fontSize: theme.type.caption.fontSize,
    color: theme.sm.muted,
  },
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.md,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.sm.divider,
    borderRadius: theme.sm.optionRadius,
    padding: 20,
    backgroundColor: theme.sm.cardBg,
  },
  descriptionCopy: {
    flex: 1,
    gap: 6,
  },
  descriptionHeadline: {
    fontFamily: theme.font.bold,
    fontSize: 15,
    lineHeight: 18,
    color: theme.sm.text,
  },
  descriptionBody: {
    fontFamily: theme.font.body,
    fontSize: theme.type.setupSubtitle.fontSize,
    lineHeight: 21,
    color: theme.sm.muted,
  },
  userPhoto: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.sm.divider,
  },
  fallbackNote: {
    fontFamily: theme.font.body,
    fontSize: theme.type.caption.fontSize,
    color: theme.sm.muted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  disclaimer: {
    fontFamily: theme.font.body,
    fontSize: theme.type.caption.fontSize,
    color: theme.sm.textCaption,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: theme.flow.screenPadding,
    paddingTop: theme.space.md,
  },
  continueButton: {
    height: theme.flow.ctaHeight,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.sm.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodyMd.fontSize,
    color: theme.sm.buttonPrimaryText,
  },
})
