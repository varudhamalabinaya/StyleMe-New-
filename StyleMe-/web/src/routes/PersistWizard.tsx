import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { saveDraft } from '../lib/wizard-storage'
import { useWizard } from '../context/useWizard'

const DEBOUNCE_MS = 300

/** Debounced localStorage draft when guest; skips splash/auth paths in lastPath. */
export function PersistWizard() {
  const { pathname } = useLocation()
  const {
    authMode,
    setup,
    prompt,
    selectedStylePill,
    faceShape,
    resultIdeas,
  } = useWizard()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (authMode !== 'guest') return

    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      saveDraft({
        setup,
        prompt,
        selectedStylePill,
        faceShape,
        resultIdeas,
        lastPath: pathname,
      })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer.current)
  }, [
    authMode,
    setup,
    prompt,
    selectedStylePill,
    faceShape,
    resultIdeas,
    pathname,
  ])

  return null
}
