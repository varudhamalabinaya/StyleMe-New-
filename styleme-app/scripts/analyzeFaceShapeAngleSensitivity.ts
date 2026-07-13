/**
 * Estimates how much face-shape measurements move under head roll/pitch
 * when only eye-tilt (roll) normalization is applied — same as production.
 *
 * Run: npx tsx scripts/analyzeFaceShapeAngleSensitivity.ts
 */
import { classifyFromMeasurements, classifyShape, type Point } from '../lib/faceShape'
import type { FaceShapeMeasurements } from '../lib/faceShapeDebug'

type BaselineFace = {
  cheekHalfWidth: number
  faceHalfLength: number
  jawHalfWidth: number
  foreheadHalfWidth: number
  eyeY: number
}

function makeLandmarks(config: BaselineFace): Point[] {
  const pts: Point[] = Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 }))
  const cx = 0.5
  const cy = 0.5

  pts[33] = { x: cx - 0.15, y: config.eyeY, z: 0.02 }
  pts[263] = { x: cx + 0.15, y: config.eyeY, z: 0.02 }
  pts[10] = { x: cx, y: cy - config.faceHalfLength, z: -0.04 }
  pts[152] = { x: cx, y: cy + config.faceHalfLength, z: 0.06 }
  pts[234] = { x: cx - config.cheekHalfWidth, y: cy, z: 0.08 }
  pts[454] = { x: cx + config.cheekHalfWidth, y: cy, z: 0.08 }
  pts[172] = { x: cx - config.jawHalfWidth, y: cy + config.faceHalfLength * 0.7, z: 0.07 }
  pts[397] = { x: cx + config.jawHalfWidth, y: cy + config.faceHalfLength * 0.7, z: 0.07 }
  pts[103] = { x: cx - config.foreheadHalfWidth, y: cy - config.faceHalfLength * 0.6, z: -0.02 }
  pts[332] = { x: cx + config.foreheadHalfWidth, y: cy - config.faceHalfLength * 0.6, z: -0.02 }
  pts[136] = { x: cx - config.jawHalfWidth * 0.82, y: cy + config.faceHalfLength * 0.45, z: 0.05 }
  pts[365] = { x: cx + config.jawHalfWidth * 0.82, y: cy + config.faceHalfLength * 0.45, z: 0.05 }

  return pts
}

function rotateRoll(pts: Point[], rollDeg: number): Point[] {
  const eyeL = pts[33]!
  const eyeR = pts[263]!
  const cx = (eyeL.x + eyeR.x) / 2
  const cy = (eyeL.y + eyeR.y) / 2
  const rad = (rollDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return pts.map((p) => {
    const x = p.x - cx
    const y = p.y - cy
    return { ...p, x: x * cos - y * sin + cx, y: x * sin + y * cos + cy }
  })
}

/** Pitch: rotate y/z around eye midline (chin up/down in 3D → ratio shifts in 2D). */
function rotatePitch(pts: Point[], pitchDeg: number): Point[] {
  const eyeL = pts[33]!
  const eyeR = pts[263]!
  const cy = (eyeL.y + eyeR.y) / 2
  const rad = (pitchDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return pts.map((p) => {
    const y = p.y - cy
    const z = p.z ?? 0
    const yRot = y * cos - z * sin
    const zRot = y * sin + z * cos
    return { ...p, y: yRot + cy, z: zRot }
  })
}

function extractMeasurementsAfterPipeline(pts: Point[]): FaceShapeMeasurements {
  const result = classifyShape(pts)
  void result
  // classifyShape doesn't return measurements; mirror production math after roll fix:
  const eyeL = pts[33]!
  const eyeR = pts[263]!
  const angle = Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x)
  const center = { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 }
  const normalized = pts.map((p) => {
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    const x = p.x - center.x
    const y = p.y - center.y
    return { ...p, x: x * cos - y * sin + center.x, y: x * sin + y * cos + center.y }
  })
  const top = normalized[10]!
  const chin = normalized[152]!
  const cheekL = normalized[234]!
  const cheekR = normalized[454]!
  const jawL = normalized[172]!
  const jawR = normalized[397]!
  const foreheadL = normalized[103]!
  const foreheadR = normalized[332]!
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
  const widthCheek = dist(cheekL, cheekR)
  const widthJaw = dist(jawL, jawR)
  const widthForehead = dist(foreheadL, foreheadR)
  const faceLength = dist(top, chin)
  const cheekVsJaw = Math.abs(widthCheek - widthJaw) / widthCheek
  const cheekVsForehead = Math.abs(widthCheek - widthForehead) / widthCheek
  return {
    widthCheek,
    widthJaw,
    widthForehead,
    faceLength,
    ratio: faceLength / widthCheek,
    jawRel: widthJaw / widthCheek,
    foreheadRel: widthForehead / widthCheek,
    cheekVsJaw,
    cheekVsForehead,
    cheekDominance: Math.max(cheekVsJaw, cheekVsForehead),
    jawCornerAngleDeg: null,
  }
}

function summarize(values: number[]): { min: number; max: number; span: number; std: number } {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return { min, max, span: max - min, std: Math.sqrt(variance) }
}

const baseline: BaselineFace = {
  cheekHalfWidth: 0.5,
  faceHalfLength: 0.4575,
  jawHalfWidth: 0.3825,
  foreheadHalfWidth: 0.386,
  eyeY: 0.42,
}

console.log('=== Angle sensitivity (production pipeline: roll correction only) ===\n')

const pitchAngles = [-25, -15, -8, 0, 8, 15, 25]
const rollAngles = [-20, -10, 0, 10, 20]

console.log('--- Pitch sweep (same synthetic face, chin up/down) ---')
const pitchRows: Array<{ pitch: number; shape: string; m: FaceShapeMeasurements }> = []
for (const pitch of pitchAngles) {
  const pts = rotatePitch(makeLandmarks(baseline), pitch)
  const result = classifyShape(pts)
  const m = extractMeasurementsAfterPipeline(pts)
  pitchRows.push({ pitch, shape: result.shape, m })
  console.log(
    `pitch ${pitch.toString().padStart(3)}° → ${result.shape.padEnd(8)} | ratio ${m.ratio.toFixed(3)} jawRel ${m.jawRel.toFixed(3)} foreheadRel ${m.foreheadRel.toFixed(3)} cheekDom ${m.cheekDominance.toFixed(3)}`,
  )
}

console.log('\nPitch span (±25°):')
console.log('  ratio          ', summarize(pitchRows.map((r) => r.m.ratio)))
console.log('  jawRel         ', summarize(pitchRows.map((r) => r.m.jawRel)))
console.log('  foreheadRel    ', summarize(pitchRows.map((r) => r.m.foreheadRel)))
console.log('  cheekDominance ', summarize(pitchRows.map((r) => r.m.cheekDominance)))
console.log(`  labels seen    : ${[...new Set(pitchRows.map((r) => r.shape))].join(', ')}\n`)

console.log('--- Roll sweep (roll correction ON in pipeline) ---')
const rollRows: Array<{ roll: number; shape: string; m: FaceShapeMeasurements }> = []
for (const roll of rollAngles) {
  const pts = rotateRoll(makeLandmarks(baseline), roll)
  const result = classifyShape(pts)
  const m = extractMeasurementsAfterPipeline(pts)
  rollRows.push({ roll, shape: result.shape, m })
  console.log(
    `roll ${roll.toString().padStart(3)}° → ${result.shape.padEnd(8)} | ratio ${m.ratio.toFixed(3)} jawRel ${m.jawRel.toFixed(3)} foreheadRel ${m.foreheadRel.toFixed(3)} cheekDom ${m.cheekDominance.toFixed(3)}`,
  )
}

console.log('\nRoll span (±20°):')
console.log('  ratio          ', summarize(rollRows.map((r) => r.m.ratio)))
console.log('  jawRel         ', summarize(rollRows.map((r) => r.m.jawRel)))
console.log('  foreheadRel    ', summarize(rollRows.map((r) => r.m.foreheadRel)))
console.log('  cheekDominance ', summarize(rollRows.map((r) => r.m.cheekDominance)))
console.log(`  labels seen    : ${[...new Set(rollRows.map((r) => r.shape))].join(', ')}\n`)

console.log('--- Your Metro logs (4 captures, mixed framing/angle) ---')
const metroLogs: Array<{ label: string; m: FaceShapeMeasurements }> = [
  {
    label: 'term11 photo 1',
    m: {
      widthCheek: 0.361,
      widthJaw: 0.285,
      widthForehead: 0.278,
      faceLength: 0.328,
      ratio: 0.909,
      jawRel: 0.788,
      foreheadRel: 0.771,
      cheekVsJaw: 0.212,
      cheekVsForehead: 0.229,
      cheekDominance: 0.229,
      jawCornerAngleDeg: 21,
    },
  },
  {
    label: 'term11 photo 2',
    m: {
      widthCheek: 0.392,
      widthJaw: 0.295,
      widthForehead: 0.306,
      faceLength: 0.358,
      ratio: 0.913,
      jawRel: 0.752,
      foreheadRel: 0.782,
      cheekVsJaw: 0.248,
      cheekVsForehead: 0.218,
      cheekDominance: 0.248,
      jawCornerAngleDeg: 20,
    },
  },
  {
    label: 'term12 low-ratio photo',
    m: {
      widthCheek: 0.644,
      widthJaw: 0.493,
      widthForehead: 0.501,
      faceLength: 0.339,
      ratio: 0.526,
      jawRel: 0.766,
      foreheadRel: 0.779,
      cheekVsJaw: 0.234,
      cheekVsForehead: 0.221,
      cheekDominance: 0.234,
      jawCornerAngleDeg: 15,
    },
  },
  {
    label: 'term12 high-ratio photo',
    m: {
      widthCheek: 0.23,
      widthJaw: 0.197,
      widthForehead: 0.156,
      faceLength: 0.47,
      ratio: 2.044,
      jawRel: 0.858,
      foreheadRel: 0.676,
      cheekVsJaw: 0.142,
      cheekVsForehead: 0.324,
      cheekDominance: 0.324,
      jawCornerAngleDeg: 23,
    },
  },
]

for (const row of metroLogs) {
  const r = classifyFromMeasurements(row.m)
  console.log(
    `${row.label.padEnd(24)} → ${r.shape.padEnd(8)} | ratio ${row.m.ratio.toFixed(3)} jawRel ${row.m.jawRel.toFixed(3)} foreheadRel ${row.m.foreheadRel.toFixed(3)} cheekDom ${row.m.cheekDominance.toFixed(3)}`,
  )
}

const pair11Ratio = Math.abs(metroLogs[0]!.m.ratio - metroLogs[1]!.m.ratio)
const pair11Jaw = Math.abs(metroLogs[0]!.m.jawRel - metroLogs[1]!.m.jawRel)
const pair11Fore = Math.abs(metroLogs[0]!.m.foreheadRel - metroLogs[1]!.m.foreheadRel)
const pair11Dom = Math.abs(metroLogs[0]!.m.cheekDominance - metroLogs[1]!.m.cheekDominance)

console.log('\nClosest pair (term11 photo 1 vs 2 — similar frontal selfies):')
console.log(`  Δratio          ${pair11Ratio.toFixed(3)}`)
console.log(`  ΔjawRel         ${pair11Jaw.toFixed(3)}`)
console.log(`  ΔforeheadRel    ${pair11Fore.toFixed(3)}`)
console.log(`  ΔcheekDominance ${pair11Dom.toFixed(3)}`)
console.log(`  labels          ${classifyFromMeasurements(metroLogs[0]!.m).shape} vs ${classifyFromMeasurements(metroLogs[1]!.m).shape}`)

console.log('\nAll 4 Metro captures:')
console.log('  ratio span      ', summarize(metroLogs.map((r) => r.m.ratio)))
console.log('  jawRel span     ', summarize(metroLogs.map((r) => r.m.jawRel)))
console.log('  foreheadRel span', summarize(metroLogs.map((r) => r.m.foreheadRel)))
console.log('  cheekDom span   ', summarize(metroLogs.map((r) => r.m.cheekDominance)))

console.log(
  '\nConclusion: if ratio span > ~0.15 for the same person, pitch/framing is dominating — add pitch normalization before ratios.',
)
