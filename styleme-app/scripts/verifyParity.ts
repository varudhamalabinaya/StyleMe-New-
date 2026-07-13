/**
 * Parity check: style recommendations vs web buildStyleIdeas fixture.
 * Run: npx tsx scripts/verifyParity.ts
 */
import { buildStyleIdeas } from '../lib/styleData'

const fixture = {
  faceShape: 'Oval' as const,
  setup: {
    gender: 'Woman',
    occasion: 'Work professional',
    hairLengthPref: 'Medium',
    hairGoal: 'Easy daily style',
    otherDetails: {
      gender: '',
      occasion: '',
      hairLengthPref: '',
      hairGoal: '',
    },
  },
  prompt: 'softer around the jaw',
  selectedStylePill: 'Soft layers',
}

const ideas = buildStyleIdeas(fixture)
const titles = ideas.map((i) => i.title)

console.log('StyleMe mobile buildStyleIdeas titles:')
console.log(titles.join('\n'))

const expected = [
  'Wavy Shoulder Cut',
  'Layered Midi Curls',
  'Airy Long Shag',
  'Long Face-Framing Layers',
  'Polished Textured Bob',
]

if (JSON.stringify(titles) !== JSON.stringify(expected)) {
  console.error('Mismatch vs web fixture:', expected)
  process.exit(1)
}

console.log('Parity OK — matches web buildStyleIdeas for fixture.')
