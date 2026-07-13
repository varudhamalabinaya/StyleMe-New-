import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../lib/theme'

type FlowHeaderNavProps = {
  macroStep: number
}

export function FlowHeaderNav({ macroStep }: FlowHeaderNavProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, theme.space.sm) }]}>
      <View style={styles.row}>
        <Text style={styles.brand}>StyleMe</Text>
        <Text style={styles.stepLabel}>
          Step {macroStep} of {theme.flow.macroSteps}
        </Text>
      </View>
      <View style={styles.segments}>
        {Array.from({ length: theme.flow.macroSteps }).map((_, index) => (
          <View
            key={index}
            style={[styles.segment, index < macroStep && styles.segmentActive]}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.flow.screenPadding,
    paddingBottom: theme.space.md,
    gap: theme.space.md,
  },
  row: {
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
  segments: {
    flexDirection: 'row',
    gap: 4,
    height: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: theme.sm.divider,
  },
  segmentActive: {
    backgroundColor: theme.sm.buttonPrimary,
  },
})
