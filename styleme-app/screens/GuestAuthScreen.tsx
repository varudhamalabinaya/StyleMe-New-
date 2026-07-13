import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { markGuestEntryComplete } from '../lib/guestSession'
import { theme } from '../lib/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'GuestAuth'>

const FEATURES = [
  'Face-shape analysis on device',
  'Personalized cut and color ideas',
  'No account required to start',
] as const

export default function GuestAuthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()

  function handleContinue() {
    try {
      markGuestEntryComplete()
      // #region agent log
      fetch('http://127.0.0.1:7581/ingest/978b9440-4ce2-4785-8f24-c8ce0542f3cb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'adbeae' },
        body: JSON.stringify({
          sessionId: 'adbeae',
          runId: 'pre-fix',
          hypothesisId: 'D',
          location: 'GuestAuthScreen.tsx:handleContinue',
          message: 'Guest continue succeeded',
          data: {},
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      navigation.navigate('SetupGender')
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7581/ingest/978b9440-4ce2-4785-8f24-c8ce0542f3cb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'adbeae' },
        body: JSON.stringify({
          sessionId: 'adbeae',
          runId: 'pre-fix',
          hypothesisId: 'D',
          location: 'GuestAuthScreen.tsx:handleContinue',
          message: 'Guest continue failed',
          data: { error: error instanceof Error ? error.message : 'unknown' },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topContent}>
        <View style={styles.hero}>
          <View style={styles.logoClip}>
            <Image source={require('../assets/images/logo.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.headline}>Hairstyles tailored to your face shape.</Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.bullet} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.actions,
          { paddingBottom: Math.max(theme.flow.screenPadding, insets.bottom + theme.space.sm) },
        ]}
      >
        <View style={styles.divider} />
        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue as guest</Text>
        </Pressable>
        <Text style={styles.footerCaption}>Guest mode — progress saved on device</Text>
      </View>
    </View>
  )
}

const LOGO_SCALE = 1.5385
const LOGO_OFFSET_X = -0.2692
const LOGO_OFFSET_Y = -0.0769

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.sm.pageBg,
  },
  topContent: {
    flex: 1,
  },
  hero: {
    padding: theme.flow.screenPadding,
    gap: theme.flow.sectionGap,
  },
  logoClip: {
    width: theme.flow.logoSm,
    height: theme.flow.logoSm,
    overflow: 'hidden',
  },
  logoImage: {
    position: 'absolute',
    width: theme.flow.logoSm * LOGO_SCALE,
    height: theme.flow.logoSm * LOGO_SCALE,
    left: theme.flow.logoSm * LOGO_OFFSET_X,
    top: theme.flow.logoSm * LOGO_OFFSET_Y,
  },
  headline: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.heroTitle.fontSize,
    lineHeight: theme.type.heroTitle.lineHeight,
    color: theme.sm.text,
  },
  features: {
    paddingHorizontal: theme.flow.screenPadding,
    paddingBottom: theme.flow.screenPadding,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.flow.featureBulletGap,
    minHeight: theme.flow.featureRowHeight,
  },
  bullet: {
    width: theme.flow.featureBulletSize,
    height: theme.flow.featureBulletSize,
    borderRadius: theme.flow.featureBulletSize / 2,
    backgroundColor: theme.sm.text,
  },
  featureText: {
    flex: 1,
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodyMd.fontSize,
    lineHeight: theme.type.bodyMd.lineHeight,
    color: theme.sm.text,
  },
  actions: {
    paddingHorizontal: theme.flow.screenPadding,
    paddingTop: theme.flow.screenPadding,
    gap: theme.flow.actionsGap,
  },
  divider: {
    height: 1,
    backgroundColor: theme.sm.divider,
    alignSelf: 'stretch',
  },
  button: {
    height: theme.flow.ctaHeight,
    borderRadius: theme.flow.ctaRadius,
    backgroundColor: theme.sm.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  buttonText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodyMd.fontSize,
    lineHeight: theme.type.bodyMd.lineHeight,
    color: theme.sm.buttonPrimaryText,
  },
  footerCaption: {
    fontFamily: theme.font.body,
    fontSize: theme.type.caption.fontSize,
    lineHeight: theme.type.caption.lineHeight,
    color: theme.sm.textCaption,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
})
