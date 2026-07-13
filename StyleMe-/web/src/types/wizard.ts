export type AuthMode = 'unauthenticated' | 'guest'

export interface SetupState {
  gender: string
  occasion: string
  hairLengthPref: string
  hairGoal: string
}

export interface StyleIdea {
  title: string
  description: string
  /** Optional URL from VITE_HAIR_PREVIEW_API_URL (or persisted draft). */
  imageUrl?: string | null
}

export const defaultSetup: SetupState = {
  gender: '',
  occasion: '',
  hairLengthPref: '',
  hairGoal: '',
}
