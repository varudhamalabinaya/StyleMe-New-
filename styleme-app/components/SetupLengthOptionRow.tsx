import { Pressable, StyleSheet, Text, View } from 'react-native'
import { theme } from '../lib/theme'

const BAR_WIDTH = 2
const BAR_GAP = 2
const BAR_HEIGHTS = [4, 8, 12, 16, 20] as const

type SetupLengthOptionRowProps = {
  label: string
  barCount: number
  selected: boolean
  onPress: () => void
}

export function SetupLengthOptionRow({
  label,
  barCount,
  selected,
  onPress,
}: SetupLengthOptionRowProps) {
  const barColor = selected ? theme.sm.buttonPrimaryText : theme.sm.text

  return (
    <Pressable style={[styles.row, selected && styles.rowSelected]} onPress={onPress}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      <View style={styles.trailing}>
        <View style={styles.bars}>
          {BAR_HEIGHTS.slice(0, barCount).map((height, index) => (
            <View
              key={index}
              style={[styles.bar, { height, backgroundColor: barColor }]}
            />
          ))}
        </View>
        {selected ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: theme.flow.optionRowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.flow.optionRowPaddingX,
    borderRadius: theme.sm.optionRadius,
    borderWidth: 1,
    borderColor: theme.sm.divider,
    backgroundColor: theme.sm.cardBg,
  },
  rowSelected: {
    borderWidth: 0,
    backgroundColor: theme.sm.buttonPrimary,
  },
  label: {
    flex: 1,
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodyMd.fontSize,
    lineHeight: theme.type.bodyMd.lineHeight,
    color: theme.sm.text,
  },
  labelSelected: {
    fontFamily: theme.font.semibold,
    color: theme.sm.buttonPrimaryText,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 1,
  },
  checkmark: {
    fontSize: 18,
    lineHeight: 20,
    color: theme.sm.buttonPrimaryText,
    fontWeight: '700',
  },
})
