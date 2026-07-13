/**
 * StyleMe design tokens for React Native StyleSheets.
 * Ported from web/src/design-system/styleme-tokens.css + web/src/theme.css.
 * MASTER.md pink palette intentionally omitted.
 */

import { Dimensions, Platform, ViewStyle } from 'react-native'

const REM = 16

function rem(value: number): number {
  return value * REM
}

/** Approximates CSS clamp(minRem, vwRatio * width, maxRem). */
export function clampVw(minRem: number, vwRatio: number, maxRem: number, width = Dimensions.get('window').width): number {
  const vw = (vwRatio / 100) * width
  return Math.min(rem(maxRem), Math.max(rem(minRem), vw))
}

export type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>

function shadow(
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number,
): ShadowStyle {
  return {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: Platform.OS === 'android' ? elevation : undefined,
  }
}

/** Figma artboard baseline (390×844 iOS frames). */
export const FIGMA_SCREEN = { width: 390, height: 844 } as const

export const theme = {
  sm: {
    pageBg: '#ffffff',
    dot: 'rgba(0, 0, 0, 0.055)',
    dotSize: 14,
    cardBg: '#ffffff',
    cardRadius: 12,
    optionRadius: 12,
    inputSurface: '#f7f7f7',
    accent: '#e2e633',
    accentHover: '#d4d82a',
    accentSoft: '#f4f7c8',
    text: '#000000',
    muted: '#555555',
    textSubtle: '#bbbbbb',
    dotInactive: '#d0d0d0',
    divider: '#e8e8e8',
    textCaption: '#888888',
    buttonPrimary: '#000000',
    buttonPrimaryText: '#ffffff',
    label: '#5c5c5c',
    borderSubtle: '#e5e5e5',
    inputBorder: '#3a3a3a',
    inputRadius: 10,
    inputBg: '#ffffff',
    topbarBg: 'rgba(255, 255, 255, 0.92)',
    headerBg: '#f9f9f9',
    headerBorder: '#ececec',
    flowCardMax: rem(32),
    flowCardWideMax: rem(48),
    stepperRail: '#e5e5e5',
    stepperRailHeight: 2,
    stepperAxisHeight: 14,
    stepperDotSize: 10,
    stepperDotActive: '#e2e633',
    stepperLabelCurrent: '#000000',
    stepperLabelDone: '#737373',
    stepperLabelPending: '#b8b8b8',
    stepperLabelSize: rem(0.8125),
    stepperRing: '#f5f5f5',
  },
  color: {
    primary: '#6c5ce7',
    secondary: '#a78bfa',
    cta: '#6c5ce7',
    background: '#f8f9fb',
    text: '#1a1a1a',
    textMuted: '#6b7280',
    surface: '#ffffff',
    border: '#e6e8ef',
  },
  space: {
    xs: rem(0.25),
    sm: rem(0.5),
    compact: rem(0.75),
    md: rem(1),
    lg: rem(1.5),
    xl: rem(1.75),
    xl2: rem(2.25),
    xl3: rem(3),
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 12,
    pill: 999,
  },
  shadow: {
    sm: shadow(1, 2, 0.04, 1),
    md: shadow(4, 12, 0.06, 3),
    lg: shadow(8, 24, 0.08, 6),
    card: shadow(8, 20, 0.08, 8),
  },
  font: {
    heading: 'Inter_700Bold',
    body: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extrabold: 'Inter_800ExtraBold',
  },
  type: {
    splashTitle: { fontSize: 22, lineHeight: 27 },
    heroTitle: { fontSize: 28, lineHeight: 34 },
    setupTitle: { fontSize: 22, lineHeight: 27 },
    promptTitle: { fontSize: 26, lineHeight: 32 },
    promptSubtitle: { fontSize: 15, lineHeight: 18 },
    resultsTitle: { fontSize: 24, lineHeight: 29 },
    setupSubtitle: { fontSize: 14, lineHeight: 17 },
    brandMd: { fontSize: 18, lineHeight: 22 },
    stepLabel: { fontSize: 14, lineHeight: 17 },
    questionLabel: { fontSize: 12, lineHeight: 15 },
    bodyMd: { fontSize: 16, lineHeight: 19 },
    caption: { fontSize: 12, lineHeight: 15 },
  },
  flow: {
    screenPadding: rem(1.5),
    logoSm: 32,
    sectionGap: 32,
    featureRowHeight: 56,
    featureBulletSize: 10,
    featureBulletGap: 16,
    ctaHeight: 56,
    ctaRadius: 28,
    setupCtaRadius: 26,
    actionsGap: 12,
    macroSteps: 5,
    setupQuestions: 4,
    progressTrackWidth: 342,
    progressTrackHeight: 6,
    progressFillStep1: 68,
    optionRowHeight: 56,
    optionRowPaddingX: 20,
    optionGap: 10,
    otherInputHeight: 48,
    questionAccentWidth: 3,
    questionAccentHeight: 16,
    chipBorder: '#d0d0d0',
    analysisBadgeBg: '#f0f0f0',
  },
  capture: {
    sheetRadius: 24,
    guideOvalWidth: 220,
    guideOvalHeight: 280,
    closeSize: 36,
    tipBadgeSize: 32,
    primaryHeight: 52,
    primaryRadius: 12,
  },
  splash: {
    centerTopRatio: 320 / FIGMA_SCREEN.height,
    footerDotBottomRatio: 94 / FIGMA_SCREEN.height,
    logoSize: 56,
    logoTextGap: 24,
    textGap: 8,
    dotSize: 8,
    dotGap: 8,
    dotRadius: 4,
  },
  transitionMs: 200,
} as const

export type Theme = typeof theme

/*
 * RN approximations (no direct CSS equivalent):
 *
 * - sm-card-shadow dual layer (22px/50px + 8px/20px): collapsed to theme.shadow.card
 * - Dot-grid background: use Image tile or SVG pattern; not included in theme object
 * - clamp() flow/stepper paddings: use clampVw() at layout time
 * - CSS transition ease: use Animated with Easing.inOut(Easing.ease) and transitionMs
 * - prefers-reduced-motion: AccessibilityInfo.isReduceMotionEnabled()
 */
