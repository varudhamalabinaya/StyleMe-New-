import { StyleSheet, TextInput, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import { SetupFlowLayout } from '../../components/SetupFlowLayout'
import { SetupOptionRow } from '../../components/SetupOptionRow'
import { useWizard } from '../../context/WizardContext'
import {
  GENDER_OPTIONS,
  OTHER_OPTION,
  withOtherOption,
} from '../../lib/setupOptions'
import { theme } from '../../lib/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'SetupGender'>

const OPTIONS = withOtherOption(GENDER_OPTIONS)
const STEP_KEY = 'gender' as const

export default function SetupGenderScreen({ navigation }: Props) {
  const { setup, setSetupField, setSetupOtherDetail } = useWizard()
  const selected = setup.gender
  const otherText = setup.otherDetails.gender
  const isOtherSelected = selected === OTHER_OPTION
  const canProceed = Boolean(selected) && (!isOtherSelected || otherText.trim().length > 0)

  return (
    <SetupFlowLayout
      macroStep={1}
      questionIndex={1}
      title="Who are we styling for?"
      subtitle="Helps us tailor cuts and framing."
      canProceed={canProceed}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      onNext={() => navigation.navigate('SetupOccasion')}
    >
      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <SetupOptionRow
            key={option}
            label={option}
            selected={selected === option}
            onPress={() => setSetupField(STEP_KEY, option)}
          />
        ))}
        {isOtherSelected ? (
          <TextInput
            style={styles.otherInput}
            value={otherText}
            onChangeText={(text) => setSetupOtherDetail(STEP_KEY, text)}
            placeholder="Tell us more..."
            placeholderTextColor={theme.sm.textSubtle}
            autoFocus
          />
        ) : null}
      </View>
    </SetupFlowLayout>
  )
}

const styles = StyleSheet.create({
  options: {
    gap: theme.flow.optionGap,
  },
  otherInput: {
    height: theme.flow.otherInputHeight,
    borderRadius: theme.sm.optionRadius,
    borderWidth: 1,
    borderColor: theme.sm.divider,
    backgroundColor: theme.sm.inputSurface,
    paddingHorizontal: theme.flow.optionRowPaddingX,
    fontFamily: theme.font.body,
    fontSize: theme.type.setupSubtitle.fontSize,
    lineHeight: theme.type.setupSubtitle.lineHeight,
    color: theme.sm.text,
  },
})
