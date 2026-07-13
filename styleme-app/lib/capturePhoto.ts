import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

const LOG_PREFIX = '[CaptureDebug]'

function log(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(LOG_PREFIX, message, data)
    return
  }
  console.log(LOG_PREFIX, message)
}

export async function requestGalleryPhoto(): Promise<string | null> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    log('gallery permission', { granted: perm.granted, status: perm.status, canAskAgain: perm.canAskAgain })

    if (!perm.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access in Settings to choose an image for face shape analysis.',
      )
      return null
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.9,
      allowsEditing: false,
    })
    log('gallery picker result', { canceled: result.canceled, assetCount: result.assets?.length ?? 0 })

    if (result.canceled || !result.assets[0]?.uri) {
      return null
    }

    return result.assets[0].uri
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open gallery'
    log('gallery picker error', { message })
    Alert.alert('Gallery failed', message)
    return null
  }
}

/** Opens the system camera UI via expo-image-picker (works without ExpoCamera preview module). */
export async function requestSystemCameraPhoto(): Promise<string | null> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    log('camera permission (image-picker)', {
      granted: perm.granted,
      status: perm.status,
      canAskAgain: perm.canAskAgain,
    })

    if (!perm.granted) {
      Alert.alert(
        'Camera access needed',
        'Allow camera access in Settings to take a photo for face shape analysis.',
      )
      return null
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: false,
      cameraType: ImagePicker.CameraType.front,
    })
    log('system camera result', { canceled: result.canceled, assetCount: result.assets?.length ?? 0 })

    if (result.canceled || !result.assets[0]?.uri) {
      return null
    }

    return result.assets[0].uri
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open camera'
    log('system camera error', { message })
    Alert.alert('Camera failed', message)
    return null
  }
}
