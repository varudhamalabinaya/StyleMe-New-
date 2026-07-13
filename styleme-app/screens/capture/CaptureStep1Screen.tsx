import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import CaptureCoachScreen from './CaptureCoachScreen'

type Props = NativeStackScreenProps<RootStackParamList, 'CaptureStep1'>

export default function CaptureStep1Screen({ navigation }: Props) {
  return (
    <CaptureCoachScreen
      stepIndex={0}
      navigation={navigation}
      onClose={() => navigation.navigate('SetupGoal')}
      onAdvance={() => navigation.navigate('CaptureStep2')}
    />
  )
}
