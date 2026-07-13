import { StyleSheet, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import { SetupFlowLayout } from '../../components/SetupFlowLayout'
import { SetupLengthOptionRow } from '../../components/SetupLengthOptionRow'
import { useWizard } from '../../context/WizardContext'
import { HAIR_LENGTH_OPTIONS } from '../../lib/setupOptions'
import { theme } from '../../lib/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'SetupLength'>

const OPTIONS = [...HAIR_LENGTH_OPTIONS]
const BAR_COUNTS = [1, 2, 3, 4, 5] as const
const STEP_KEY = 'hairLengthPref' as const

export default function SetupLengthScreen({ navigation }: Props) {
  const { setup, setSetupField } = useWizard()
  const selected = setup.hairLengthPref
  const canProceed = Boolean(selected)

  return (
    <SetupFlowLayout
      macroStep={3}
      questionIndex={3}
      title="How long is your hair now?"
      subtitle="Length shapes which cuts work best."
      canProceed={canProceed}
      onBack={() => navigation.navigate('SetupOccasion')}
      onNext={() => navigation.navigate('SetupGoal')}
    >
      <View style={styles.options}>
        {OPTIONS.map((option, index) => (
          <SetupLengthOptionRow
            key={option}
            label={option}
            barCount={BAR_COUNTS[index]}
            selected={selected === option}
            onPress={() => setSetupField(STEP_KEY, option)}
          />
        ))}
      </View>
    </SetupFlowLayout>
  )
}

const styles = StyleSheet.create({
  options: {
    gap: theme.flow.optionGap,
  },
})
