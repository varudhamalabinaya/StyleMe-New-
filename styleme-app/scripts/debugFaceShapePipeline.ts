/**
 * Simulates landmark geometries through classifyShape().
 * Run: npx tsx scripts/debugFaceShapePipeline.ts
 *
 * Synthetic fixtures use real-world measurement ranges (ratio ~0.9), not legacy web geometry (~1.3+).
 * Real-log fixtures replay Metro [FaceShapeDebug] measurements from device testing.
 */
import {
  classifyFromMeasurements,
  classifyShape,
  detectFaceShapeFromLandmarks,
  FACE_SHAPE_LABELS,
  type FaceShapeLabel,
  type Point,
} from '../lib/faceShape'
import type { FaceShapeMeasurements } from '../lib/faceShapeDebug'
import { CLASSIFY_KEY_INDICES, pickKeyPoints } from '../lib/faceShapeDebug'

type LandmarkGeometry = {
  label: string
  expected: FaceShapeLabel
  cheekHalfWidth: number
  faceHalfLength: number
  jawHalfWidth: number
  foreheadHalfWidth: number
  eyeY: number
}

function makeSyntheticLandmarks(config: LandmarkGeometry): Point[] {
  const pts: Point[] = Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 }))
  const cx = 0.5
  const cy = 0.5

  pts[33] = { x: cx - 0.15, y: config.eyeY, z: 0 }
  pts[263] = { x: cx + 0.15, y: config.eyeY, z: 0 }
  pts[10] = { x: cx, y: cy - config.faceHalfLength, z: 0 }
  pts[152] = { x: cx, y: cy + config.faceHalfLength, z: 0 }
  pts[234] = { x: cx - config.cheekHalfWidth, y: cy, z: 0 }
  pts[454] = { x: cx + config.cheekHalfWidth, y: cy, z: 0 }
  pts[172] = { x: cx - config.jawHalfWidth, y: cy + config.faceHalfLength * 0.7, z: 0 }
  pts[397] = { x: cx + config.jawHalfWidth, y: cy + config.faceHalfLength * 0.7, z: 0 }
  pts[103] = { x: cx - config.foreheadHalfWidth, y: cy - config.faceHalfLength * 0.6, z: 0 }
  pts[332] = { x: cx + config.foreheadHalfWidth, y: cy - config.faceHalfLength * 0.6, z: 0 }
  pts[136] = { x: cx - config.jawHalfWidth * 0.82, y: cy + config.faceHalfLength * 0.45, z: 0 }
  pts[365] = { x: cx + config.jawHalfWidth * 0.82, y: cy + config.faceHalfLength * 0.45, z: 0 }

  return pts
}

/** Real-world ranges: ratio = faceHalfLength / cheekHalfWidth (~0.88–2.0 on device). */
const syntheticFixtures: LandmarkGeometry[] = [
  {
    label: 'Synthetic ROUND-ish (real ratio band)',
    expected: 'Round',
    cheekHalfWidth: 0.5,
    faceHalfLength: 0.4525,
    jawHalfWidth: 0.46,
    foreheadHalfWidth: 0.465,
    eyeY: 0.42,
  },
  {
    label: 'Synthetic OBLONG-ish (real outlier ratio ~2.0)',
    expected: 'Oblong',
    cheekHalfWidth: 0.115,
    faceHalfLength: 0.235,
    jawHalfWidth: 0.099,
    foreheadHalfWidth: 0.078,
    eyeY: 0.42,
  },
  {
    label: 'Synthetic DIAMOND-ish (real ratio band)',
    expected: 'Diamond',
    cheekHalfWidth: 0.5,
    faceHalfLength: 0.4725,
    jawHalfWidth: 0.3875,
    foreheadHalfWidth: 0.3675,
    eyeY: 0.42,
  },
  {
    label: 'Synthetic TRIANGLE-ish (Pear merged, real ratio band)',
    expected: 'Triangle',
    cheekHalfWidth: 0.5,
    faceHalfLength: 0.459,
    jawHalfWidth: 0.4275,
    foreheadHalfWidth: 0.3275,
    eyeY: 0.42,
  },
  {
    label: 'Synthetic HEART-ish (real ratio band)',
    expected: 'Heart',
    cheekHalfWidth: 0.5,
    faceHalfLength: 0.456,
    jawHalfWidth: 0.36,
    foreheadHalfWidth: 0.392,
    eyeY: 0.42,
  },
  {
    label: 'Synthetic OVAL-ish (real ratio band)',
    expected: 'Oval',
    cheekHalfWidth: 0.5,
    faceHalfLength: 0.4575,
    jawHalfWidth: 0.3825,
    foreheadHalfWidth: 0.386,
    eyeY: 0.42,
  },
  {
    label: 'Synthetic SQUARE-ish (real ratio band)',
    expected: 'Square',
    cheekHalfWidth: 0.5,
    faceHalfLength: 0.454,
    jawHalfWidth: 0.398,
    foreheadHalfWidth: 0.384,
    eyeY: 0.42,
  },
]

/** Measurements copied from Metro [FaceShapeDebug] classifyShape:result on real photos. */
const realLogFixtures: Array<{
  label: string
  measurements: FaceShapeMeasurements
}> = [
  {
    label: 'Real photo A (Metro term 11)',
    measurements: {
      widthCheek: 0.3609332976801123,
      widthJaw: 0.284537543123355,
      widthForehead: 0.2781188563036006,
      faceLength: 0.3281613813794735,
      ratio: 0.9092022916387064,
      jawRel: 0.7883383022630811,
      foreheadRel: 0.7705547204738411,
      cheekVsJaw: 0.21166169773691887,
      cheekVsForehead: 0.22944527952615887,
      cheekDominance: 0.22944527952615887,
      jawCornerAngleDeg: 20.696830328304582,
    },
  },
  {
    label: 'Real photo B (Metro term 11)',
    measurements: {
      widthCheek: 0.3917155254693425,
      widthJaw: 0.29463890593123343,
      widthForehead: 0.30636167266981124,
      faceLength: 0.3576855459241285,
      ratio: 0.9131257830425785,
      jawRel: 0.7521757162374542,
      foreheadRel: 0.7821024512692911,
      cheekVsJaw: 0.24782428376254584,
      cheekVsForehead: 0.21789754873070885,
      cheekDominance: 0.24782428376254584,
      jawCornerAngleDeg: 20.4045815408277,
    },
  },
  {
    label: 'Real photo C — long face (Metro term 12, was Oblong)',
    measurements: {
      widthCheek: 0.23005509997263318,
      widthJaw: 0.19745579175769282,
      widthForehead: 0.1555521147310406,
      faceLength: 0.4702530065454968,
      ratio: 2.0440885970423475,
      jawRel: 0.8582978242220307,
      foreheadRel: 0.6761515599938654,
      cheekVsJaw: 0.14170217577796929,
      cheekVsForehead: 0.3238484400061345,
      cheekDominance: 0.3238484400061345,
      jawCornerAngleDeg: 22.83332547625274,
    },
  },
  {
    label: 'Real photo D (Metro term 12, was Diamond)',
    measurements: {
      widthCheek: 0.35341343225186883,
      widthJaw: 0.2744656407149389,
      widthForehead: 0.26171293705802595,
      faceLength: 0.3348305938046919,
      ratio: 0.9474189808554491,
      jawRel: 0.7766134947562892,
      foreheadRel: 0.740529117386545,
      cheekVsJaw: 0.22338650524371081,
      cheekVsForehead: 0.25947088261345497,
      cheekDominance: 0.25947088261345497,
      jawCornerAngleDeg: 20.4045815408277,
    },
  },
  {
    label: 'Real photo E (Metro term 12, was Diamond)',
    measurements: {
      widthCheek: 0.3814803502961653,
      widthJaw: 0.2909988189457372,
      widthForehead: 0.29977973904266236,
      faceLength: 0.34922071686935985,
      ratio: 0.9154356616225177,
      jawRel: 0.762814699944094,
      foreheadRel: 0.7858327140832444,
      cheekVsJaw: 0.23718530005590596,
      cheekVsForehead: 0.21416728591675563,
      cheekDominance: 0.23718530005590596,
      jawCornerAngleDeg: 21.476253911610492,
    },
  },
]

console.log('=== Face shape pipeline debug ===\n')
console.log(`Labels (${FACE_SHAPE_LABELS.length}):`, FACE_SHAPE_LABELS.join(', '))
console.log('\nCalibrated for real MediaPipe ratio ~0.9 (not legacy web ~1.3+).\n')

let failures = 0

console.log('--- Synthetic landmarks (real-world ratio band) ---\n')
for (const fixture of syntheticFixtures) {
  const points = makeSyntheticLandmarks(fixture)
  const classified = classifyShape(points)
  const detected = detectFaceShapeFromLandmarks(points)

  console.log(`${fixture.label} (expect ${fixture.expected})`)
  console.log('  classifyShape ->', classified)
  console.log('  detectFaceShapeFromLandmarks ->', detected)

  if (classified.shape !== fixture.expected) {
    console.error(`  FAIL: expected ${fixture.expected}, got ${classified.shape}`)
    failures++
  }
  console.log('')
}

console.log('--- Real Metro log replay (varied labels required) ---\n')
const realLabels: FaceShapeLabel[] = []
for (const fixture of realLogFixtures) {
  const result = classifyFromMeasurements(fixture.measurements)
  realLabels.push(result.shape)
  console.log(`${fixture.label}`)
  console.log('  ->', result.shape, `(confidence ${result.confidence.toFixed(2)})`)
  console.log('  scores:', JSON.stringify(result.scores, null, 2))
  console.log('')
}

const uniqueRealLabels = new Set(realLabels)
if (uniqueRealLabels.size < 3) {
  console.error(
    `FAIL: real-log replay produced only ${uniqueRealLabels.size} unique label(s): ${[...uniqueRealLabels].join(', ')}`,
  )
  failures++
} else {
  console.log(`Real-log replay: ${uniqueRealLabels.size} unique labels -> ${[...uniqueRealLabels].join(', ')}`)
}

if (realLabels[2] !== 'Oblong') {
  console.error(`FAIL: long-face real photo C must classify as Oblong, got ${realLabels[2]}`)
  failures++
}

console.log('\n=== Empty landmark array (MediaPipe no-face path) ===')
console.log(detectFaceShapeFromLandmarks([]))

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}

console.log('\nAll checks passed.')
console.log('On device: reload app and compare [FaceShapeDebug] scores across different photos in Metro.')
