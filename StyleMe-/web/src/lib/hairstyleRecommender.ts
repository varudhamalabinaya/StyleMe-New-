import type { FaceShapeLabel } from './faceShapeMock'
import type { SetupState } from '../types/wizard'
import {
  HAIRSTYLE_CATALOG,
  type HairstyleCatalogItem,
  type LengthBucket,
  type StyleFamily,
} from './hairstyleCatalog'

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

export function getDefaultRecommenderWeights(): RecommenderWeights {
  return { ...DEFAULT_WEIGHTS }
}

const PILL_TO_TAGS: Record<string, string[]> = {
  'Soft layers': ['soft', 'movement', 'layers'],
  'Bold color': ['statement', 'editorial', 'creative'],
  'Low-maintenance': ['low-maintenance', 'easy', 'professional'],
  'Formal event': ['formal', 'wedding', 'sleek'],
  'Beachy texture': ['texture', 'beachy', 'natural'],
  'Face-framing': ['face-framing', 'soft', 'frame'],
  'Sleek & polished': ['sleek', 'professional', 'clean'],
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

function reasonsFor(item: HairstyleCatalogItem, input: RecommendInput, lengthHit: boolean): string[] {
  const reasons: string[] = []
  reasons.push(`fits ${input.faceShape.toLowerCase()} face balance`)
  if (lengthHit) reasons.push(`${item.lengthBucket} length match`)
  if (input.setup.hairGoal) reasons.push(`${input.setup.hairGoal.toLowerCase()} goal support`)
  if (input.setup.occasion) reasons.push(`works for ${input.setup.occasion.toLowerCase()}`)
  if (item.maintenance === 'low') reasons.push('easy upkeep')
  return reasons.slice(0, 3)
}

function scoreItem(item: HairstyleCatalogItem, input: RecommendInput): Scored {
  const weights = input.weights ?? DEFAULT_WEIGHTS
  const targetLength = inferLengthBucket(input.setup.hairLengthPref)
  const lengthScore = targetLength ? (item.lengthBucket === targetLength ? 1 : 0.45) : 0.72
  const faceScore = item.faceShapeAffinity[input.faceShape]
  const genderScore = scoreGender(item, input.setup.gender)
  const goalScore = tagMatchScore(item, [normalize(input.setup.hairGoal)].filter(Boolean))
  const occasionScore = tagMatchScore(item, [normalize(input.setup.occasion)].filter(Boolean))
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
    reasons: reasonsFor(item, input, targetLength ? item.lengthBucket === targetLength : false),
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

export function recommendHairstyles(input: RecommendInput, topK = 5): Array<{
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

// Lightweight "training" hook for phase-2 feedback loops.
export function trainWeightsFromFeedback(
  feedback: Array<{
    input: RecommendInput
    pickedStyleId: string
  }>,
  epochs = 3,
): RecommenderWeights {
  const w = { ...DEFAULT_WEIGHTS }
  if (feedback.length === 0) return w
  const lr = 0.02

  for (let e = 0; e < epochs; e += 1) {
    for (const row of feedback) {
      const recs = recommendHairstyles({ ...row.input, weights: w }, 8)
      const pickedRank = recs.findIndex((r) => r.id === row.pickedStyleId)
      if (pickedRank <= 0) continue
      // Push toward stronger personalization when selected style is ranked too low.
      w.faceShape = Math.min(0.5, w.faceShape + lr * 0.5)
      w.length = Math.min(0.3, w.length + lr * 0.3)
      w.goal = Math.min(0.3, w.goal + lr * 0.2)
      w.occasion = Math.min(0.2, w.occasion + lr * 0.2)
      w.gender = Math.min(0.15, w.gender + lr * 0.1)
      w.pillPrompt = Math.min(0.15, w.pillPrompt + lr * 0.1)
    }
  }
  return w
}

export function evaluateRecommender(
  profiles: RecommendInput[],
  topK = 5,
): {
  deterministic: boolean
  diverseByProfile: boolean
  maxSameFamilyInAnyTopK: number
  reports: Array<{
    index: number
    topIds: string[]
    uniqueFamilies: number
    maxFamilyRepeat: number
  }>
} {
  const reports = profiles.map((profile, index) => {
    const first = recommendHairstyles(profile, topK)
    const second = recommendHairstyles(profile, topK)
    const deterministic = first.map((x) => x.id).join('|') === second.map((x) => x.id).join('|')

    const families = first
      .map((r) => HAIRSTYLE_CATALOG.find((s) => s.id === r.id)?.family)
      .filter((x): x is StyleFamily => x !== undefined)
    const counts = new Map<StyleFamily, number>()
    for (const f of families) counts.set(f, (counts.get(f) ?? 0) + 1)
    const maxFamilyRepeat = Math.max(...Array.from(counts.values()), 0)

    return {
      index,
      topIds: first.map((x) => x.id),
      uniqueFamilies: new Set(families).size,
      maxFamilyRepeat,
      deterministic,
    }
  })

  const allDeterministic = reports.every((r) => r.deterministic)
  const uniqueTopSets = new Set(reports.map((r) => r.topIds.join('|')))
  const diverseByProfile = uniqueTopSets.size > 1
  const maxSameFamilyInAnyTopK = Math.max(...reports.map((r) => r.maxFamilyRepeat), 0)

  return {
    deterministic: allDeterministic,
    diverseByProfile,
    maxSameFamilyInAnyTopK,
    reports: reports.map((r) => ({
      index: r.index,
      topIds: r.topIds,
      uniqueFamilies: r.uniqueFamilies,
      maxFamilyRepeat: r.maxFamilyRepeat,
    })),
  }
}

