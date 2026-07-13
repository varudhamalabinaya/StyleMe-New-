package expo.modules.facelandmarks

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarker
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FaceLandmarksModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FaceLandmarks")

    AsyncFunction("detectFromImageAsync") { imageUri: String, promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject("ERR_NO_CONTEXT", "React context unavailable", null)
      } else try {
        val uri = Uri.parse(imageUri)
        val inputStream = context.contentResolver.openInputStream(uri)
          ?: throw IllegalStateException("Could not open image URI")
        val bitmap = BitmapFactory.decodeStream(inputStream)
        inputStream.close()

        if (bitmap == null) {
          throw IllegalStateException("Could not decode image")
        }

        val width = bitmap.width
        val height = bitmap.height

        val baseOptions = BaseOptions.builder()
          .setModelAssetPath("face_landmarker.task")
          .build()

        val options = FaceLandmarker.FaceLandmarkerOptions.builder()
          .setBaseOptions(baseOptions)
          .setRunningMode(RunningMode.IMAGE)
          .setNumFaces(1)
          .build()

        val landmarker = FaceLandmarker.createFromOptions(context, options)
        val mpImage = BitmapImageBuilder(bitmap).build()
        val result = landmarker.detect(mpImage)
        landmarker.close()
        bitmap.recycle()

        val faces = result.faceLandmarks()
        if (faces.isNullOrEmpty()) {
          promise.resolve(
            mapOf(
              "landmarks" to emptyList<Map<String, Double>>(),
              "width" to width,
              "height" to height,
            ),
          )
        } else {
          val landmarks = faces[0].map { lm ->
            mapOf(
              "x" to lm.x().toDouble(),
              "y" to lm.y().toDouble(),
              "z" to lm.z().toDouble(),
            )
          }

          promise.resolve(
            mapOf(
              "landmarks" to landmarks,
              "width" to width,
              "height" to height,
            ),
          )
        }
      } catch (e: Exception) {
        promise.reject("ERR_FACE_LANDMARKS", e.message, e)
      }
    }
  }
}
