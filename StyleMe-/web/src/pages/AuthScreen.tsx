import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Screen } from '../components/ui/Screen'
import { useWizard } from '../context/useWizard'
import { clearDraft } from '../lib/wizard-storage'
import { paths } from '../routes/paths'

export function AuthScreen() {
  const navigate = useNavigate()
  const { setGuest } = useWizard()
  const [busy, setBusy] = useState(false)
  const [guestError, setGuestError] = useState<string | null>(null)

  const onGuest = async () => {
    setGuestError(null)
    setBusy(true)
    try {
      clearDraft()
      await setGuest()
      navigate(paths.setup)
    } catch (e) {
      setGuestError(e instanceof Error ? e.message : 'Could not start guest session.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen center>
      <div className="guest-panel">
        <div className="guest-panel__intro">
          <h1 className="ui-title">Continue</h1>
          <p className="ui-body">
            No password for this demo. With Supabase in <code>.env</code>, anonymous sign-in runs
            only if enabled in your project.
          </p>
        </div>
        {guestError ? (
          <div className="ui-status ui-status--alert" role="alert">
            <p>{guestError}</p>
          </div>
        ) : null}
        <div className="guest-panel__action">
          <Button variant="primary" onClick={onGuest} disabled={busy}>
            {busy ? 'Continuing…' : 'Continue'}
          </Button>
        </div>
      </div>
    </Screen>
  )
}
