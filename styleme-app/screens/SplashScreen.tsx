import { useEffect } from 'react'
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { hasCompletedGuestEntry } from '../lib/guestSession'
import { theme } from '../lib/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const entered = hasCompletedGuestEntry()
    if (entered) {
      navigation.replace('SetupGender')
      return undefined
    }
    timer = setTimeout(() => navigation.replace('GuestAuth'), 2000)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [navigation])

  const { height } = Dimensions.get('window')
  const centerTop = theme.splash.centerTopRatio * height
  const footerPaddingBottom = theme.splash.footerDotBottomRatio * height

  return (
    <View style={styles.container}>
      <View style={[styles.centerContent, { top: centerTop }]}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <View style={styles.textBlock}>
          <Text style={styles.title}>StyleMe</Text>
          <Text style={styles.tagline}>Your AI hairstylist</Text>
          <Text style={styles.version}>v2.0</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
        <View style={styles.pagination}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.sm.pageBg,
  },
  centerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: theme.splash.logoTextGap,
  },
  logo: {
    width: theme.splash.logoSize,
    height: theme.splash.logoSize,
  },
  textBlock: {
    alignItems: 'center',
    gap: theme.splash.textGap,
  },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.splashTitle.fontSize,
    lineHeight: theme.type.splashTitle.lineHeight,
    color: theme.sm.text,
  },
  tagline: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodyMd.fontSize,
    lineHeight: theme.type.bodyMd.lineHeight,
    color: theme.sm.muted,
  },
  version: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    lineHeight: theme.type.caption.lineHeight,
    color: theme.sm.textSubtle,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.splash.dotGap,
  },
  dot: {
    width: theme.splash.dotSize,
    height: theme.splash.dotSize,
    borderRadius: theme.splash.dotRadius,
    backgroundColor: theme.sm.dotInactive,
  },
  dotActive: {
    backgroundColor: theme.sm.text,
  },
})
