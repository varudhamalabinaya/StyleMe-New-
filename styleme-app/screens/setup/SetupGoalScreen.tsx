import { StyleSheet, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import { SetupFlowLayout } from '../../components/SetupFlowLayout'
import { SetupOptionRow } from '../../components/SetupOptionRow'
import { useWizard } from '../../context/WizardContext'
import { HAIR_GOAL_OPTIONS } from '../../lib/setupOptions'
import { theme } from '../../lib/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'SetupGoal'>

const OPTIONS = [...HAIR_GOAL_OPTIONS]
const STEP_KEY = 'hairGoal' as const

export default function SetupGoalScreen({ navigation }: Props) {
  const { setup, setSetupField } = useWizard()
  const selected = setup.hairGoal
  const canProceed = Boolean(selected)

  return (
    <SetupFlowLayout
      macroStep={4}
      questionIndex={4}
      title="What is your main style goal?"
      subtitle="Fine-tunes your recommendations."
      canProceed={canProceed}
      onBack={() => navigation.navigate('SetupLength')}
      onNext={() => navigation.navigate('CaptureStep1')}
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
      </View>
    </SetupFlowLayout>
  )
}

const styles = StyleSheet.create({
  options: {
    gap: theme.flow.optionGap,
  },
})
