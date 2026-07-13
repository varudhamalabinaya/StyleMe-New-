import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SplashScreen from '../screens/SplashScreen'
import GuestAuthScreen from '../screens/GuestAuthScreen'
import SetupGenderScreen from '../screens/setup/SetupGenderScreen'
import SetupOccasionScreen from '../screens/setup/SetupOccasionScreen'
import SetupLengthScreen from '../screens/setup/SetupLengthScreen'
import SetupGoalScreen from '../screens/setup/SetupGoalScreen'
import CaptureStep1Screen from '../screens/capture/CaptureStep1Screen'
import CaptureStep2Screen from '../screens/capture/CaptureStep2Screen'
import CaptureStep3Screen from '../screens/capture/CaptureStep3Screen'
import CapturePreviewScreen from '../screens/capture/CapturePreviewScreen'
import FaceShapeRevealScreen from '../screens/FaceShapeRevealScreen'
import StylePromptScreen from '../screens/StylePromptScreen'
import ResultsScreen from '../screens/ResultsScreen'

export type RootStackParamList = {
  Splash: undefined
  GuestAuth: undefined
  SetupGender: undefined
  SetupOccasion: undefined
  SetupLength: undefined
  SetupGoal: undefined
  CaptureStep1: undefined
  CaptureStep2: undefined
  CaptureStep3: undefined
  CapturePreview: undefined
  FaceShapeReveal: { photoUri: string; shape: string; confidence: number; fallback: boolean }
  StylePrompt: undefined
  Results: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="GuestAuth" component={GuestAuthScreen} />
        <Stack.Screen name="SetupGender" component={SetupGenderScreen} />
        <Stack.Screen name="SetupOccasion" component={SetupOccasionScreen} />
        <Stack.Screen name="SetupLength" component={SetupLengthScreen} />
        <Stack.Screen name="SetupGoal" component={SetupGoalScreen} />
        <Stack.Screen
          name="CaptureStep1"
          getComponent={() => require('../screens/capture/CaptureStep1Screen').default}
        />
        <Stack.Screen
          name="CaptureStep2"
          getComponent={() => require('../screens/capture/CaptureStep2Screen').default}
        />
        <Stack.Screen
          name="CaptureStep3"
          getComponent={() => require('../screens/capture/CaptureStep3Screen').default}
        />
        <Stack.Screen
          name="CapturePreview"
          getComponent={() => require('../screens/capture/CapturePreviewScreen').default}
        />
        <Stack.Screen name="FaceShapeReveal" component={FaceShapeRevealScreen} />
        <Stack.Screen name="StylePrompt" component={StylePromptScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
