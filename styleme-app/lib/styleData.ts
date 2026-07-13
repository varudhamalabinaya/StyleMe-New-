import type { FaceShapeLabel } from './faceShape'
import { resolveSetupAnswers, type SetupState } from './setupOptions'

export type LengthBucket = 'short' | 'medium' | 'long'
export type MaintenanceLevel = 'low' | 'medium' | 'high'
export type StyleFamily =
  | 'pixie'
  | 'bob'
  | 'lob'
  | 'layers'
  | 'shag'
  | 'wolf'
  | 'bangs'
  | 'braid'
  | 'updo'
  | 'curls'
  | 'sleek'

export interface HairstyleCatalogItem {
  id: string
  title: string
  family: StyleFamily
  lengthBucket: LengthBucket
  maintenance: MaintenanceLevel
  vibeTags: string[]
  goalTags: string[]
  occasionTags: string[]
  genderFit: Array<'feminine' | 'masculine' | 'unisex'>
  faceShapeAffinity: Record<FaceShapeLabel, number>
}

const round2 = (n: number) => Math.round(n * 100) / 100

const AFF = (
  oval: number,
  round: number,
  square: number,
  heart: number,
  oblong: number,
): Record<FaceShapeLabel, number> => ({
  Oval: oval,
  Round: round,
  Square: square,
  Heart: heart,
  Oblong: oblong,
  Diamond: round2((oval + heart) / 2),
  Triangle: round2(square * 0.55 + oval * 0.25 + round * 0.1 + (1 - heart) * 0.1),
})

export const HAIRSTYLE_CATALOG: HairstyleCatalogItem[] = [
  {
    id: 'wolf-cut',
    title: 'Wolf Cut',
    family: 'wolf',
    lengthBucket: 'medium',
    maintenance: 'medium',
    vibeTags: ['edgy', 'texture', 'volume'],
    goalTags: ['volume', 'shape', 'refresh'],
    occasionTags: ['everyday', 'casual', 'street'],
    genderFit: ['unisex'],
    faceShapeAffinity: AFF(0.83, 0.71, 0.74, 0.8, 0.78),
  },
  {
    id: 'textured-bixie',
    title: 'Textured Bixie',
    family: 'pixie',
    lengthBucket: 'short',
    maintenance: 'low',
    vibeTags: ['airy', 'smart', 'modern'],
    goalTags: ['low-maintenance', 'confidence', 'shape'],
    occasionTags: ['everyday', 'work'],
    genderFit: ['feminine', 'unisex'],
    faceShapeAffinity: AFF(0.82, 0.7, 0.75, 0.78, 0.73),
  },
  {
    id: 'soft-layered-lob',
    title: 'Soft Layered Lob',
    family: 'lob',
    lengthBucket: 'medium',
    maintenance: 'low',
    vibeTags: ['soft', 'face-framing', 'natural'],
    goalTags: ['shape', 'softness', 'balanced'],
    occasionTags: ['everyday', 'work', 'formal'],
    genderFit: ['feminine', 'unisex'],
    faceShapeAffinity: AFF(0.86, 0.84, 0.79, 0.82, 0.77),
  },
  {
    id: 'curtain-shag',
    title: 'Curtain Shag',
    family: 'shag',
    lengthBucket: 'medium',
    maintenance: 'medium',
    vibeTags: ['retro', 'movement', 'texture'],
    goalTags: ['volume', 'texture', 'refresh'],
    occasionTags: ['casual', 'events'],
    genderFit: ['unisex'],
    faceShapeAffinity: AFF(0.8, 0.76, 0.7, 0.85, 0.71),
  },
  {
    id: 'polished-textured-bob',
    title: 'Polished Textured Bob',
    family: 'bob',
    lengthBucket: 'short',
    maintenance: 'medium',
    vibeTags: ['sleek', 'professional', 'clean'],
    goalTags: ['shape', 'confidence', 'polish'],
    occasionTags: ['work', 'formal', 'wedding'],
    genderFit: ['feminine', 'unisex'],
    faceShapeAffinity: AFF(0.85, 0.78, 0.77, 0.79, 0.68),
  },
  {
    id: 'long-face-framing-layers',
    title: 'Long Face-Framing Layers',
    family: 'layers',
    lengthBucket: 'long',
    maintenance: 'medium',
    vibeTags: ['romantic', 'soft', 'flow'],
    goalTags: ['length', 'face-framing', 'movement'],
    occasionTags: ['formal', 'date', 'everyday'],
    genderFit: ['feminine', 'unisex'],
    faceShapeAffinity: AFF(0.83, 0.86, 0.75, 0.8, 0.72),
  },
  {
    id: 'blunt-french-bob',
    title: 'Blunt French Bob',
    family: 'bob',
    lengthBucket: 'short',
    maintenance: 'high',
    vibeTags: ['statement', 'editorial', 'bold'],
    goalTags: ['sharp', 'shape', 'refresh'],
    occasionTags: ['events', 'formal'],
    genderFit: ['feminine', 'unisex'],
    faceShapeAffinity: AFF(0.78, 0.63, 0.82, 0.68, 0.58),
  },
  {
    id: 'soft-side-part-pixie',
    title: 'Soft Side-Part Pixie',
    family: 'pixie',
    lengthBucket: 'short',
    maintenance: 'medium',
    vibeTags: ['clean', 'playful', 'light'],
    goalTags: ['low-maintenance', 'lift'],
    occasionTags: ['work', 'everyday'],
    genderFit: ['feminine', 'masculine', 'unisex'],
    faceShapeAffinity: AFF(0.81, 0.67, 0.76, 0.8, 0.62),
  },
  {
    id: 'sleek-center-part-long',
    title: 'Sleek Center-Part Long',
    family: 'sleek',
    lengthBucket: 'long',
    maintenance: 'high',
    vibeTags: ['sleek', 'minimal', 'red-carpet'],
    goalTags: ['length', 'polish'],
    occasionTags: ['formal', 'events'],
    genderFit: ['unisex'],
    faceShapeAffinity: AFF(0.8, 0.66, 0.74, 0.77, 0.79),
  },
  {
    id: 'wavy-shoulder-cut',
    title: 'Wavy Shoulder Cut',
    family: 'layers',
    lengthBucket: 'medium',
    maintenance: 'low',
    vibeTags: ['beachy', 'soft', 'airy'],
    goalTags: ['volume', 'texture', 'easy'],
    occasionTags: ['everyday', 'weekend'],
    genderFit: ['unisex'],
    faceShapeAffinity: AFF(0.84, 0.88, 0.78, 0.79, 0.69),
  },
  {
    id: 'curly-rounded-shape',
    title: 'Curly Rounded Shape',
    family: 'curls',
    lengthBucket: 'medium',
    maintenance: 'medium',
    vibeTags: ['natural', 'defined', 'volume'],
    goalTags: ['texture', 'volume', 'natural'],
    occasionTags: ['everyday', 'celebration'],
    genderFit: ['unisex'],
    faceShapeAffinity: AFF(0.82, 0.77, 0.84, 0.73, 0.66),
  },
  {
    id: 'shoulder-braid-crown',
    title: 'Braided Crown Half-Up',
    family: 'braid',
    lengthBucket: 'long',
    maintenance: 'high',
    vibeTags: ['romantic', 'boho', 'event'],
    goalTags: ['formal', 'statement'],
    occasionTags: ['wedding', 'formal', 'events'],
    genderFit: ['feminine', 'unisex'],
    faceShapeAffinity: AFF(0.79, 0.81, 0.74, 0.82, 0.67),
  },
  {
    id: 'textured-mullet-lite',
    title: 'Textured Mullet Lite',
    family: 'wolf',
    lengthBucket: 'medium',
    maintenance: 'medium',
    vibeTags: ['edgy', 'alt', 'creative'],
    goalTags: ['refresh', 'identity', 'volume'],
    occasionTags: ['casual', 'street'],
    genderFit: ['unisex'],
    faceShapeAffinity: AFF(0.75, 0.68, 0.77, 0.76, 0.73),
  },
  {
    id: 'clean-taper-crop',
    title: 'Clean Taper Crop',
    family: 'pixie',
    lengthBucket: 'short',
    maintenance: 'low',
    vibeTags: ['clean', 'structured', 'modern'],
    goalTags: ['low-maintenance', 'professional'],
    occasionTags: ['work', 'everyday'],
    genderFit: ['masculine', 'unisex'],
    faceShapeAffinity: AFF(0.8, 0.65, 0.85, 0.71, 0.7),
  },
  {
    id: 'classic-side-sweep',
    title: 'Classic Side-Swept Layers',
    family: 'layers',
    lengthBucket: 'medium',
    maintenance: 'low',
    vibeTags: ['classic', 'versatile', 'soft'],
    goalTags: ['balanced', 'easy', 'shape'],
    occasionTags: ['work', 'everyday', 'formal'],
    genderFit: ['unisex'],
    faceShapeAffinity: AFF(0.87, 0.82, 0.8, 0.81, 0.75),
  },
  {
    id: 'wispy-curtain-bangs',
    title: 'Wispy Curtain Bangs + Layers',
    family: 'bangs',
    lengthBucket: 'medium',
    maintenance: 'medium',
    vibeTags: ['soft', 'face-framing', 'trendy'],
    goalTags: ['softness', 'frame', 'refresh'],
    occasionTags: ['everyday', 'date'],
    genderFit: ['feminine', 'unisex'],
    faceShapeAffinity: AFF(0.82, 0.86, 0.72, 0.84, 0.65),
  },
  {
    id: 'sleek-low-bun',
    title: 'Sleek Low Bun Look',
    family: 'updo',
    lengthBucket: 'long',
    maintenance: 'medium',
    vibeTags: ['formal', 'sleek', 'elegant'],
    goalTags: ['formal', 'polish'],
    occasionTags: ['wedding', 'formal', 'office'],
    genderFit: ['unisex'],
    faceShapeAffinity: AFF(0.8, 0.71, 0.76, 0.74, 0.83),
  },
  {
    id: 'layered-midi-curls',
    title: 'Layered Midi Curls',
    family: 'curls',
    lengthBucket: 'medium',
    maintenance: 'medium',
    vibeTags: ['defined', 'bouncy', 'natural'],
    goalTags: ['volume', 'texture', 'natural'],
    occasionTags: ['everyday', 'events'],
    genderFit: ['unisex'],
    faceShapeAffinity: AFF(0.84, 0.79, 0.8, 0.77, 0.69),
  },
  {
    id: 'shoulder-blunt-lob',
    title: 'Shoulder Blunt Lob',
    family: 'lob',
    lengthBucket: 'medium',
    maintenance: 'low',
    vibeTags: ['clean', 'modern', 'smart'],
    goalTags: ['shape', 'professional', 'easy'],
    occasionTags: ['work', 'formal', 'everyday'],
    genderFit: ['unisex'],
    faceShapeAffinity: AFF(0.83, 0.74, 0.82, 0.76, 0.72),
  },
  {
    id: 'airy-long-shag',
    title: 'Airy Long Shag',
    family: 'shag',
    lengthBucket: 'long',
    maintenance: 'medium',
    vibeTags: ['texture', 'movement', 'light'],
    goalTags: ['volume', 'refresh'],
    occasionTags: ['casual', 'everyday'],
    genderFit: ['unisex'],
    faceShapeAffinity: AFF(0.81, 0.77, 0.74, 0.82, 0.68),
  },
]

// --- Recommender (ported from hairstyleRecommender.ts; eval/training hooks omitted) ---

export type RecommenderWeights = {
  faceShape: number
  length: number
  goal: number
  occasion: number
  gender: number
  pillPrompt: number
}

const DEFAULT_WEIGHTS: RecommenderWeights = {
  faceShape: 0.35,
  length: 0.2,
  goal: 0.18,
  occasion: 0.12,
  gender: 0.1,
  pillPrompt: 0.05,
}

const PILL_TO_TAGS: Record<string, string[]> = {
  'Soft layers': ['soft', 'movement', 'layers'],
  'Bold color': ['statement', 'editorial', 'creative'],
  'Low-maintenance': ['low-maintenance', 'easy', 'professional'],
  'Formal event': ['formal', 'wedding', 'sleek'],
  'Beachy texture': ['texture', 'beachy', 'natural'],
  'Face-framing': ['face-framing', 'soft', 'frame'],
  'Sleek and polished': ['sleek', 'professional', 'clean'],
  'Natural volume': ['volume', 'natural', 'bouncy'],
}

export type RecommendInput = {
  faceShape: FaceShapeLabel
  setup: SetupState
  prompt: string
  selectedStylePill: string | null
  weights?: RecommenderWeights
}

type Scored = {
  item: HairstyleCatalogItem
  score: number
  reasons: string[]
}

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

function inferLengthBucket(pref: string): LengthBucket | null {
  const t = normalize(pref)
  if (!t) return null
  if (t.includes('short') || t.includes('pixie') || t.includes('bob')) return 'short'
  if (t.includes('long')) return 'long'
  if (t.includes('medium') || t.includes('mid') || t.includes('shoulder')) return 'medium'
  return null
}

function scoreGender(item: HairstyleCatalogItem, gender: string): number {
  const g = normalize(gender)
  if (!g) return 0.75
  if (item.genderFit.includes('unisex')) return 0.9
  if (g.includes('female') || g.includes('woman')) return item.genderFit.includes('feminine') ? 1 : 0.65
  if (g.includes('male') || g.includes('man')) return item.genderFit.includes('masculine') ? 1 : 0.65
  return 0.85
}

function tagMatchScore(item: HairstyleCatalogItem, queryTags: string[]): number {
  if (queryTags.length === 0) return 0
  const all = [...item.vibeTags, ...item.goalTags, ...item.occasionTags].map(normalize)
  const hits = queryTags.filter((tag) => all.some((x) => x.includes(tag) || tag.includes(x))).length
  return hits / queryTags.length
}

function promptTags(prompt: string): string[] {
  const p = normalize(prompt)
  if (!p) return []
  const pool = [
    'volume',
    'soft',
    'sleek',
    'formal',
    'low-maintenance',
    'texture',
    'bangs',
    'natural',
    'professional',
    'edgy',
    'face-framing',
    'polished',
  ]
  return pool.filter((k) => p.includes(k))
}

function reasonsFor(
  item: HairstyleCatalogItem,
  input: RecommendInput,
  lengthHit: boolean,
  resolved: ReturnType<typeof resolveSetupAnswers>,
): string[] {
  const reasons: string[] = []
  reasons.push(`fits ${input.faceShape.toLowerCase()} face balance`)
  if (lengthHit) reasons.push(`${item.lengthBucket} length match`)
  if (resolved.hairGoal) reasons.push(`${resolved.hairGoal.toLowerCase()} goal support`)
  if (resolved.occasion) reasons.push(`works for ${resolved.occasion.toLowerCase()}`)
  if (item.maintenance === 'low') reasons.push('easy upkeep')
  return reasons.slice(0, 3)
}

function scoreItem(item: HairstyleCatalogItem, input: RecommendInput): Scored {
  const weights = input.weights ?? DEFAULT_WEIGHTS
  const resolved = resolveSetupAnswers(input.setup)
  const targetLength = inferLengthBucket(resolved.hairLengthPref)
  const lengthScore = targetLength ? (item.lengthBucket === targetLength ? 1 : 0.45) : 0.72
  const faceScore = item.faceShapeAffinity[input.faceShape]
  const genderScore = scoreGender(item, resolved.gender)
  const goalScore = tagMatchScore(item, [normalize(resolved.hairGoal)].filter(Boolean))
  const occasionScore = tagMatchScore(item, [normalize(resolved.occasion)].filter(Boolean))
  const pillTags = input.selectedStylePill ? PILL_TO_TAGS[input.selectedStylePill] ?? [] : []
  const promptSignal = tagMatchScore(item, [...pillTags, ...promptTags(input.prompt)])
  const score =
    weights.faceShape * faceScore +
    weights.length * lengthScore +
    weights.goal * (goalScore || 0.5) +
    weights.occasion * (occasionScore || 0.5) +
    weights.gender * genderScore +
    weights.pillPrompt * (promptSignal || 0.35)

  return {
    item,
    score,
    reasons: reasonsFor(
      item,
      input,
      targetLength ? item.lengthBucket === targetLength : false,
      resolved,
    ),
  }
}

function rerankDiverse(sorted: Scored[], topK = 5): Scored[] {
  const picked: Scored[] = []
  const famCount = new Map<string, number>()
  const lenCount = new Map<string, number>()

  for (const cand of sorted) {
    if (picked.length >= topK) break
    const fam = cand.item.family
    const len = cand.item.lengthBucket
    const famPenalty = famCount.get(fam) ?? 0
    const lenPenalty = lenCount.get(len) ?? 0
    const allow = famPenalty < 2 && lenPenalty < 2
    if (!allow && sorted.length - picked.length > 2) continue

    picked.push(cand)
    famCount.set(fam, famPenalty + 1)
    lenCount.set(len, lenPenalty + 1)
  }

  if (picked.length < topK) {
    for (const cand of sorted) {
      if (picked.length >= topK) break
      if (!picked.some((p) => p.item.id === cand.item.id)) picked.push(cand)
    }
  }
  return picked
}

export function recommendHairstyles(
  input: RecommendInput,
  topK = 5,
): Array<{
  title: string
  description: string
  score: number
  id: string
}> {
  const scored = HAIRSTYLE_CATALOG.map((item) => scoreItem(item, input)).sort((a, b) => b.score - a.score)
  const reranked = rerankDiverse(scored, topK)
  return reranked.map(({ item, score, reasons }) => ({
    id: item.id,
    title: item.title,
    score,
    description: `${reasons.join(' • ')}.`,
  }))
}

// --- Style pills + ideas (ported from styleIdeas.ts) ---

export const STYLE_PILLS = [
  'Soft layers',
  'Bold color',
  'Low-maintenance',
  'Formal event',
  'Beachy texture',
  'Face-framing',
  'Sleek and polished',
  'Natural volume',
] as const

export type StyleIdea = {
  title: string
  description: string
}

export function buildStyleIdeas(input: {
  faceShape: FaceShapeLabel
  setup: SetupState
  prompt: string
  selectedStylePill: string | null
}): StyleIdea[] {
  const { faceShape, setup, prompt, selectedStylePill } = input
  return recommendHairstyles(
    {
      faceShape,
      setup,
      prompt,
      selectedStylePill,
    },
    5,
  ).map((r) => ({
    title: r.title,
    description: r.description,
  }))
}
