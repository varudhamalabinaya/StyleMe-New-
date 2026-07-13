import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Screen } from '../components/ui/Screen'
import { paths } from '../routes/paths'
import { useWizard } from '../context/useWizard'
import { clearDraft } from '../lib/wizard-storage'
import '../design-system/styleme-entry.css'

export function SplashScreen() {
  const navigate = useNavigate()
  const { setGuest } = useWizard()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onContinue = async () => {
    setError(null)
    setBusy(true)
    try {
      clearDraft()
      await setGuest()
      navigate(paths.setup)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start guest session.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen full>
      <div className="styleme-entry">
        <SiteHeader back={null} next={null} />

        <main className="styleme-entry__main">
          <div className="styleme-entry__card">
            <p className="styleme-entry__tagline">Style that suits you, not Trends</p>
            <button
              type="button"
              className="styleme-entry__cta"
              disabled={busy}
              onClick={() => void onContinue()}
            >
              {busy ? 'Starting…' : 'Continue as guest'}
            </button>
            {error ? (
              <div className="styleme-entry__error ui-status ui-status--alert" role="alert">
                <p>{error}</p>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </Screen>
  )
}
