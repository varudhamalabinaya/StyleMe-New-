import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import CaptureCoachScreen from './CaptureCoachScreen'

type Props = NativeStackScreenProps<RootStackParamList, 'CaptureStep3'>

export default function CaptureStep3Screen({ navigation }: Props) {
  return (
    <CaptureCoachScreen
      stepIndex={2}
      navigation={navigation}
      onClose={() => navigation.navigate('SetupGoal')}
      onAdvance={() => navigation.navigate('CapturePreview')}
    />
  )
}
