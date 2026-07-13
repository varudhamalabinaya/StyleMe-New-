import { Pressable, StyleSheet, Text, View } from 'react-native'
import { theme } from '../lib/theme'

type SetupOptionRowProps = {
  label: string
  selected: boolean
  onPress: () => void
}

export function SetupOptionRow({ label, selected, onPress }: SetupOptionRowProps) {
  return (
    <Pressable
      style={[styles.row, selected && styles.rowSelected]}
      onPress={onPress}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {selected ? (
        <Text style={styles.checkmark} accessibilityLabel="Selected">
          ✓
        </Text>
      ) : (
        <View style={styles.checkPlaceholder} />
      )}
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
  checkmark: {
    fontSize: 18,
    lineHeight: 20,
    color: theme.sm.buttonPrimaryText,
    fontWeight: '700',
  },
  checkPlaceholder: {
    width: 20,
    height: 20,
  },
})
