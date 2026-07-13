import type { FaceShapeLabel } from './faceShapeMock'

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

