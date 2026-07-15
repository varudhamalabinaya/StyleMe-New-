import { CommonActions } from '@react-navigation/native'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { FlowHeaderNav } from '../components/FlowHeaderNav'
import { useWizard } from '../context/WizardContext'
import type { FaceShapeLabel } from '../lib/faceShape'
import { PREVIEW_IMAGE_COUNT } from '../lib/api'
import { buildStyleIdeas } from '../lib/styleData'
import { theme } from '../lib/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>

const RESULT_BADGES = ['Best match', 'Volume boost', 'Low maintenance', 'Try something new'] as const
const RESULT_SLOTS = Array.from({ length: PREVIEW_IMAGE_COUNT }, (_, index) => index)

function ResultCard({
  title,
  badge,
  badgePrimary,
  imageUrl,
}: {
  title: string
  badge: string
  badgePrimary: boolean
  imageUrl?: string
}) {
  console.log('Rendering image:', imageUrl)

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.previewImage}
            resizeMode="cover"
            onError={(event) => {
              console.log('Image load failed:', imageUrl, event.nativeEvent)
            }}
            onLoad={() => {
              console.log('Loaded:', imageUrl)
            }}
          />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        <View style={[styles.badge, badgePrimary ? styles.badgePrimary : styles.badgeSecondary]}>
          <Text style={[styles.badgeText, badgePrimary ? styles.badgeTextPrimary : styles.badgeTextSecondary]}>
            {badge}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  )
}

export default function ResultsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets()
  const { resetWizard, setup, faceShape, prompt, selectedStylePill, generatedImageUrls } = useWizard()
  const routeImageUrls = route.params?.imageUrls ?? []
  const imageUrls =
    routeImageUrls.length > 0 ? routeImageUrls : generatedImageUrls

  console.log('ResultsScreen imageUrls:', imageUrls)

  const shapeLabel = (faceShape?.shape ?? 'Oval') as FaceShapeLabel
  const ideas = buildStyleIdeas({
    faceShape: shapeLabel,
    setup,
    prompt,
    selectedStylePill,
  }).slice(0, PREVIEW_IMAGE_COUNT)

  const displayIdeas =
    ideas.length >= PREVIEW_IMAGE_COUNT
      ? ideas
      : [
          ...ideas,
          ...Array.from({ length: PREVIEW_IMAGE_COUNT - ideas.length }, (_, i) => ({
            title: `Style idea ${ideas.length + i + 1}`,
            description: '',
          })),
        ]

  function handleStartOver() {
    resetWizard()
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'SetupGender' }],
      }),
    )
  }

  return (
    <View style={styles.container}>
      <FlowHeaderNav macroStep={5} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Your hairstyle previews</Text>
          <View style={styles.captionRow}>
            <Text style={styles.caption}>Matched to your</Text>
            <View style={styles.shapeBadge}>
              <Text style={styles.shapeBadgeText}>{shapeLabel.toLowerCase()}</Text>
            </View>
            <Text style={styles.caption}>face</Text>
          </View>
        </View>

        {imageUrls.length < PREVIEW_IMAGE_COUNT ? (
          <Text style={styles.emptyHint}>
            {imageUrls.length === 0
              ? 'Previews are still generating or unavailable. Go back and tap See results again.'
              : `Only ${imageUrls.length} of ${PREVIEW_IMAGE_COUNT} previews loaded. Go back and tap See results again.`}
          </Text>
        ) : null}

        <View style={styles.grid}>
          <View style={styles.gridRow}>
            {RESULT_SLOTS.slice(0, 2).map((index) => (
              <ResultCard
                key={index}
                title={displayIdeas[index].title}
                badge={RESULT_BADGES[index]}
                badgePrimary={index === 0}
                imageUrl={imageUrls[index]}
              />
            ))}
          </View>
          <View style={styles.gridRow}>
            {RESULT_SLOTS.slice(2, 4).map((index) => (
              <ResultCard
                key={index}
                title={displayIdeas[index].title}
                badge={RESULT_BADGES[index]}
                badgePrimary={false}
                imageUrl={imageUrls[index]}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(theme.flow.screenPadding, insets.bottom + theme.space.sm) },
        ]}
      >
        <View style={styles.footerButtons}>
          <Pressable style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save look</Text>
          </Pressable>
          <Pressable style={styles.startOverButton} onPress={handleStartOver}>
            <Text style={styles.startOverButtonText}>Start over</Text>
          </Pressable>
        </View>
        <Text style={styles.shareLink}>Share results</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.sm.pageBg,
  },
  scroll: {
    flex: 1,
  },
  body: {
    padding: theme.flow.screenPadding,
    gap: 20,
    paddingBottom: theme.space.xl2,
  },
  titleBlock: {
    gap: theme.space.xs,
  },
  title: {
    fontFamily: theme.font.extrabold,
    fontSize: theme.type.resultsTitle.fontSize,
    lineHeight: theme.type.resultsTitle.lineHeight,
    color: theme.sm.text,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    flexWrap: 'wrap',
  },
  caption: {
    fontFamily: theme.font.body,
    fontSize: theme.type.setupSubtitle.fontSize,
    color: theme.sm.textCaption,
  },
  shapeBadge: {
    backgroundColor: theme.flow.analysisBadgeBg,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space.sm,
    paddingVertical: 2,
  },
  shapeBadgeText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.caption.fontSize,
    color: theme.sm.muted,
    textTransform: 'lowercase',
  },
  grid: {
    gap: theme.space.md,
  },
  emptyHint: {
    fontFamily: theme.font.body,
    fontSize: theme.type.caption.fontSize,
    color: theme.sm.textCaption,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    gap: theme.space.md,
  },
  card: {
    flex: 1,
    gap: theme.space.sm,
  },
  imageContainer: {
    height: 160,
    borderRadius: theme.sm.optionRadius,
    borderWidth: 1,
    borderColor: theme.sm.divider,
    overflow: 'hidden',
    backgroundColor: theme.sm.cardBg,
    ...theme.shadow.sm,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: theme.sm.inputSurface,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    borderRadius: 4,
    paddingHorizontal: theme.space.sm,
    paddingVertical: 4,
  },
  badgePrimary: {
    backgroundColor: theme.sm.buttonPrimary,
  },
  badgeSecondary: {
    backgroundColor: theme.flow.analysisBadgeBg,
  },
  badgeText: {
    fontFamily: theme.font.bold,
    fontSize: 10,
    lineHeight: 12,
  },
  badgeTextPrimary: {
    color: theme.sm.buttonPrimaryText,
  },
  badgeTextSecondary: {
    color: theme.sm.muted,
  },
  cardTitle: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.setupSubtitle.fontSize,
    color: theme.sm.text,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.sm.divider,
    paddingHorizontal: theme.flow.screenPadding,
    paddingTop: theme.space.sm,
    gap: theme.space.sm,
    backgroundColor: theme.sm.pageBg,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: theme.space.sm,
  },
  saveButton: {
    flex: 1,
    height: 52,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.sm.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.sm.cardBg,
  },
  saveButtonText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodyMd.fontSize,
    color: theme.sm.text,
  },
  startOverButton: {
    flex: 1,
    height: 52,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.sm.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startOverButtonText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodyMd.fontSize,
    color: theme.sm.buttonPrimaryText,
  },
  shareLink: {
    fontFamily: theme.font.body,
    fontSize: 13,
    color: theme.sm.textCaption,
    textAlign: 'center',
    paddingBottom: theme.space.xs,
  },
})
