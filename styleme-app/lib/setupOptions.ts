/** Setup option values — ported from StyleMe web SetupScreen.tsx */

export const OTHER_OPTION = 'Other' as const

export type SetupAnswers = {
  gender: string
  occasion: string
  hairLengthPref: string
  hairGoal: string
}

export type SetupStepKey = keyof SetupAnswers

export type SetupOtherDetails = Record<SetupStepKey, string>

export type SetupState = SetupAnswers & {
  otherDetails: SetupOtherDetails
}

export const defaultSetup: SetupState = {
  gender: '',
  occasion: '',
  hairLengthPref: '',
  hairGoal: '',
  otherDetails: {
    gender: '',
    occasion: '',
    hairLengthPref: '',
    hairGoal: '',
  },
}

export const GENDER_OPTIONS = [
  'Woman',
  'Man',
  'Non-binary',
  'Prefer not to say',
] as const

export const OCCASION_OPTIONS = [
  'Everyday',
  'Special occasion',
  'Work professional',
  'Photoshoot',
  'Just exploring',
] as const

export const HAIR_LENGTH_OPTIONS = [
  'Very short',
  'Short',
  'Medium',
  'Long',
  'Extra long',
] as const

export const HAIR_GOAL_OPTIONS = [
  'Easy daily style',
  'Stand out and be bold',
  'Professional look',
  'Grow it out healthier',
  'Try something new',
] as const

export type GenderOption = (typeof GENDER_OPTIONS)[number]
export type OccasionOption = (typeof OCCASION_OPTIONS)[number]
export type HairLengthOption = (typeof HAIR_LENGTH_OPTIONS)[number]
export type HairGoalOption = (typeof HAIR_GOAL_OPTIONS)[number]

export type SetupStepConfig = {
  key: SetupStepKey
  title: string
  subtitle: string
  options: readonly string[]
  otherPlaceholder: string
}

/** Append "Other" once — available on every setup question. */
export function withOtherOption(options: readonly string[]): string[] {
  if (options.some((option) => option === OTHER_OPTION)) return [...options]
  return [...options, OTHER_OPTION]
}

export function resolveSetupAnswer(setup: SetupState, key: SetupStepKey): string {
  const value = setup[key]
  if (value === OTHER_OPTION) return setup.otherDetails[key].trim()
  return value
}

export function resolveSetupAnswers(setup: SetupState): SetupAnswers {
  return {
    gender: resolveSetupAnswer(setup, 'gender'),
    occasion: resolveSetupAnswer(setup, 'occasion'),
    hairLengthPref: resolveSetupAnswer(setup, 'hairLengthPref'),
    hairGoal: resolveSetupAnswer(setup, 'hairGoal'),
  }
}

/** One question per screen — shown in order during onboarding setup. */
export const SETUP_STEPS: readonly SetupStepConfig[] = [
  {
    key: 'gender',
    title: 'Who are we styling for?',
    subtitle: 'Helps us tailor cuts and framing to you.',
    options: withOtherOption(GENDER_OPTIONS),
    otherPlaceholder: 'Tell us how you identify…',
  },
  {
    key: 'occasion',
    title: 'When do you style your hair?',
    subtitle: 'We match suggestions to your lifestyle.',
    options: [...OCCASION_OPTIONS],
    otherPlaceholder: 'e.g. graduation, reunion…',
  },
  {
    key: 'hairLengthPref',
    title: 'How long is your hair now?',
    subtitle: 'Length shapes which cuts work best.',
    options: [...HAIR_LENGTH_OPTIONS],
    otherPlaceholder: 'e.g. chin-length bob, past shoulders…',
  },
  {
    key: 'hairGoal',
    title: 'What is your main style goal?',
    subtitle: 'Fine-tunes your recommendations.',
    options: [...HAIR_GOAL_OPTIONS],
    otherPlaceholder: 'e.g. hide grey, grow out bangs, add fringe…',
  },
] as const
