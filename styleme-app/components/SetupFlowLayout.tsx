import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../lib/theme'

type SetupFlowLayoutProps = {
  macroStep: number
  questionIndex: number
  title: string
  subtitle: string
  children: ReactNode
  canProceed: boolean
  onNext: () => void
  onBack?: () => void
  nextLabel?: string
}

export function SetupFlowLayout({
  macroStep,
  questionIndex,
  title,
  subtitle,
  children,
  canProceed,
  onNext,
  onBack,
  nextLabel = 'Next',
}: SetupFlowLayoutProps) {
  const insets = useSafeAreaInsets()
  const progressRatio = macroStep / theme.flow.macroSteps
  const progressFill = progressRatio * theme.flow.progressTrackWidth

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, theme.space.md) }]}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>StyleMe</Text>
          <Text style={styles.stepLabel}>
            Step {macroStep} of {theme.flow.macroSteps}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressFill }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionBlock}>
          <View style={styles.questionCounter}>
            <View style={styles.questionAccent} />
            <Text style={styles.questionLabel}>
              Question {questionIndex} of {theme.flow.setupQuestions}
            </Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {children}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(theme.flow.screenPadding, insets.bottom + theme.space.sm) },
        ]}
      >
        {onBack ? (
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[
            styles.nextButton,
            !canProceed && styles.nextButtonDisabled,
            !onBack && styles.nextButtonFull,
          ]}
          disabled={!canProceed}
          onPress={onNext}
        >
          <Text style={styles.nextButtonText}>{nextLabel}</Text>
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
  header: {
    paddingHorizontal: theme.flow.screenPadding,
    paddingBottom: theme.space.md,
    gap: theme.space.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: theme.font.extrabold,
    fontSize: theme.type.brandMd.fontSize,
    lineHeight: theme.type.brandMd.lineHeight,
    color: theme.sm.text,
  },
  stepLabel: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.stepLabel.fontSize,
    lineHeight: theme.type.stepLabel.lineHeight,
    color: theme.sm.textCaption,
  },
  progressTrack: {
    height: theme.flow.progressTrackHeight,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.sm.divider,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.sm.buttonPrimary,
  },
  scroll: {
    flex: 1,
  },
  body: {
    padding: theme.flow.screenPadding,
    gap: theme.flow.sectionGap,
    paddingBottom: theme.space.xl2,
  },
  questionBlock: {
    gap: theme.space.sm,
  },
  questionCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  questionAccent: {
    width: theme.flow.questionAccentWidth,
    height: theme.flow.questionAccentHeight,
    borderRadius: 2,
    backgroundColor: theme.sm.text,
  },
  questionLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.questionLabel.fontSize,
    lineHeight: theme.type.questionLabel.lineHeight,
    color: theme.sm.textCaption,
  },
  title: {
    fontFamily: theme.font.extrabold,
    fontSize: theme.type.setupTitle.fontSize,
    lineHeight: theme.type.setupTitle.lineHeight,
    color: theme.sm.text,
  },
  subtitle: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.setupSubtitle.fontSize,
    lineHeight: theme.type.setupSubtitle.lineHeight,
    color: theme.sm.muted,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.space.sm,
    paddingHorizontal: theme.flow.screenPadding,
    paddingTop: theme.flow.screenPadding,
  },
  backButton: {
    flex: 1,
    height: theme.flow.ctaHeight,
    borderRadius: theme.flow.setupCtaRadius,
    borderWidth: 1,
    borderColor: theme.sm.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.sm.pageBg,
  },
  backButtonText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodyMd.fontSize,
    color: theme.sm.text,
  },
  nextButton: {
    flex: 2,
    height: theme.flow.ctaHeight,
    borderRadius: theme.flow.setupCtaRadius,
    backgroundColor: theme.sm.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.45,
  },
  nextButtonText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodyMd.fontSize,
    lineHeight: theme.type.bodyMd.lineHeight,
    color: theme.sm.buttonPrimaryText,
  },
})
