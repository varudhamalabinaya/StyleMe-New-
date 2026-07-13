import { buildStyleIdeas } from '../../StyleMe-/web/src/lib/styleIdeas'

const fixture = {
  faceShape: 'Oval' as const,
  setup: {
    gender: 'Woman',
    occasion: 'Work / everyday',
    hairLengthPref: 'Medium',
    hairGoal: 'More volume',
  },
  prompt: 'softer around the jaw',
  selectedStylePill: 'Soft layers',
}

console.log('Web buildStyleIdeas titles:')
console.log(buildStyleIdeas(fixture).map((i) => i.title).join('\n'))
