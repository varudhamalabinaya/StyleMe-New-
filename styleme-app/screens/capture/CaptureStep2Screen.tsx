import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import CaptureCoachScreen from './CaptureCoachScreen'

type Props = NativeStackScreenProps<RootStackParamList, 'CaptureStep2'>

export default function CaptureStep2Screen({ navigation }: Props) {
  return (
    <CaptureCoachScreen
      stepIndex={1}
      navigation={navigation}
      onClose={() => navigation.navigate('SetupGoal')}
      onAdvance={() => navigation.navigate('CaptureStep3')}
    />
  )
}
