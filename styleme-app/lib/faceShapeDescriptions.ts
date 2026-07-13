import type { FaceShapeLabel } from './faceShape'

/** User-facing blurbs for each detected face shape (style guidance only). */
export const FACE_SHAPE_DESCRIPTIONS: Record<FaceShapeLabel, string> = {
  Oval:
    'Balanced proportions with a gently rounded jaw. Most lengths and layers tend to work well with minimal adjustment.',
  Round:
    'Similar width and height with soft curves. Styles with height, volume on top, or longer face-framing lines can add definition.',
  Square:
    'Strong jaw and fairly even width through forehead and cheeks. Soft layers, side parts, or texture around the jawline can balance angles.',
  Heart:
    'Wider forehead tapering to a narrower chin. Chin-length cuts, side-swept fringe, and volume around the jaw often complement this shape.',
  Oblong:
    'Longer than it is wide with a fairly straight cheek line. Width through bangs, curls, or horizontal volume can shorten the visual length.',
  Diamond:
    'Cheekbones are the widest point, with a narrower forehead and jaw. Styles that add width at the forehead or jaw — or soft texture at the chin — can feel balanced.',
  Triangle:
    'Narrower forehead with a wider jaw (angular to softly tapered). Volume at the crown, side-swept bangs, or length around the jawline can help balance proportions.',
}

export function getFaceShapeDescription(shape: FaceShapeLabel | string): string {
  if (shape in FACE_SHAPE_DESCRIPTIONS) {
    return FACE_SHAPE_DESCRIPTIONS[shape as FaceShapeLabel]
  }
  return FACE_SHAPE_DESCRIPTIONS.Oval
}
