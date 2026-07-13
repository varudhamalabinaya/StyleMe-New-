import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'assets')
const outPath = join(outDir, 'face_landmarker.task')
const url =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

await mkdir(outDir, { recursive: true })
const res = await fetch(url)
if (!res.ok || !res.body) {
  console.error('Failed to download face_landmarker.task', res.status)
  process.exit(1)
}
await pipeline(res.body, createWriteStream(outPath))
console.log('Saved', outPath)
