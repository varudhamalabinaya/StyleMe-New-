import { StyleSheet, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import { SetupFlowLayout } from '../../components/SetupFlowLayout'
import { SetupOptionRow } from '../../components/SetupOptionRow'
import { useWizard } from '../../context/WizardContext'
import { OCCASION_OPTIONS } from '../../lib/setupOptions'
import { theme } from '../../lib/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'SetupOccasion'>

const OPTIONS = [...OCCASION_OPTIONS]
const STEP_KEY = 'occasion' as const

export default function SetupOccasionScreen({ navigation }: Props) {
  const { setup, setSetupField } = useWizard()
  const selected = setup.occasion
  const canProceed = Boolean(selected)

  return (
    <SetupFlowLayout
      macroStep={2}
      questionIndex={2}
      title="When do you style your hair?"
      subtitle="We match suggestions to your lifestyle."
      canProceed={canProceed}
      onBack={() => navigation.navigate('SetupGender')}
      onNext={() => navigation.navigate('SetupLength')}
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
