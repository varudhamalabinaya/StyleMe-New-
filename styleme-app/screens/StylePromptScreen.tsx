import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { FlowHeaderNav } from '../components/FlowHeaderNav'
import { useWizard } from '../context/WizardContext'
import { createStyleSession, generateSessionImages, parseApiError, apiConfigDebug } from '../lib/api'
import { STYLE_PILLS } from '../lib/styleData'
import { theme } from '../lib/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'StylePrompt'>

const PROMPT_MAX = 200

function StyleChip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      {selected ? <Text style={styles.checkmark}>✓</Text> : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  )
}

export default function StylePromptScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const {
    setup,
    faceShape,
    photoUri,
    prompt,
    setPrompt,
    selectedStylePill,
    setSelectedStylePill,
    setSessionId,
    setGeneratedImageUrls,
  } = useWizard()
  const [submitting, setSubmitting] = useState(false)

  async function handleSeeResults() {
    if (!photoUri) {
      Alert.alert('Photo required', 'Please capture or upload a photo before generating previews.')
      return
    }

    setSubmitting(true)
    console.log('[StyleMe API] See results tapped', apiConfigDebug)
    try {
      const sessionId = await createStyleSession(photoUri, {
        gender: setup.gender,
        occasion: setup.occasion,
        hairLength: setup.hairLengthPref,
        goal: setup.hairGoal,
        faceShape: faceShape?.shape ?? 'Oval',
        userPrompt: prompt,
        stylePill: selectedStylePill,
      })

      const images = await generateSessionImages(sessionId)
      console.log('Generated images:', images)
      setSessionId(sessionId)
      setGeneratedImageUrls(images)
      navigation.navigate('Results', { imageUrls: images })
    } catch (error) {
      console.log('[StyleMe API] See results failed', parseApiError(error, 'unknown'))
      Alert.alert('Generation failed', parseApiError(error, 'Could not generate hairstyle previews.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <FlowHeaderNav macroStep={4} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Make it yours</Text>
          <Text style={styles.subtitle}>Describe what you want - or pick suggestions below.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Your style note</Text>
          <TextInput
            style={styles.input}
            multiline
            maxLength={PROMPT_MAX}
            placeholder="e.g. softer around the jaw, keep length, open to bangs..."
            placeholderTextColor={theme.sm.textSubtle}
            value={prompt}
            onChangeText={setPrompt}
            editable={!submitting}
          />
          <Text style={styles.counter}>
            {prompt.length} / {PROMPT_MAX}
          </Text>
        </View>

        <View style={styles.picksBlock}>
          <Text style={styles.picksLabel}>Quick picks</Text>
          <View style={styles.chipGrid}>
            {STYLE_PILLS.map((pill) => {
              const active = selectedStylePill === pill
              return (
                <StyleChip
                  key={pill}
                  label={pill}
                  selected={active}
                  onPress={() => setSelectedStylePill(active ? null : pill)}
                />
              )
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(theme.flow.screenPadding, insets.bottom + theme.space.sm) },
        ]}
      >
        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSeeResults}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.sm.buttonPrimaryText} />
          ) : (
            <Text style={styles.buttonText}>See results</Text>
          )}
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
  scroll: {
    flex: 1,
  },
  body: {
    padding: theme.flow.screenPadding,
    gap: theme.flow.sectionGap,
    paddingBottom: theme.space.xl2,
  },
  titleBlock: {
    gap: theme.space.sm,
  },
  title: {
    fontFamily: theme.font.extrabold,
    fontSize: theme.type.promptTitle.fontSize,
    lineHeight: theme.type.promptTitle.lineHeight,
    color: theme.sm.text,
  },
  subtitle: {
    fontFamily: theme.font.body,
    fontSize: theme.type.promptSubtitle.fontSize,
    lineHeight: theme.type.promptSubtitle.lineHeight,
    color: theme.sm.muted,
  },
  inputGroup: {
    gap: theme.space.sm,
  },
  inputLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.setupSubtitle.fontSize,
    color: theme.sm.text,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.sm.divider,
    borderRadius: theme.sm.optionRadius,
    padding: 15,
    backgroundColor: theme.sm.cardBg,
    fontFamily: theme.font.body,
    fontSize: theme.type.setupSubtitle.fontSize,
    lineHeight: theme.type.setupSubtitle.lineHeight,
    color: theme.sm.text,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: theme.font.body,
    fontSize: theme.type.caption.fontSize,
    color: theme.sm.textSubtle,
  },
  picksBlock: {
    gap: theme.space.md,
  },
  picksLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.caption.fontSize,
    color: theme.sm.textCaption,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    borderWidth: 1,
    borderColor: theme.flow.chipBorder,
    borderRadius: theme.radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.sm.cardBg,
  },
  chipSelected: {
    borderColor: theme.sm.buttonPrimary,
    backgroundColor: theme.sm.buttonPrimary,
  },
  chipText: {
    fontFamily: theme.font.body,
    fontSize: theme.type.setupSubtitle.fontSize,
    color: theme.sm.muted,
  },
  chipTextSelected: {
    fontFamily: theme.font.bold,
    color: theme.sm.buttonPrimaryText,
  },
  checkmark: {
    fontSize: 14,
    lineHeight: 16,
    color: theme.sm.buttonPrimaryText,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: theme.flow.screenPadding,
    paddingTop: theme.space.md,
  },
  button: {
    height: theme.flow.ctaHeight,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.sm.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodyMd.fontSize,
    color: theme.sm.buttonPrimaryText,
  },
})
