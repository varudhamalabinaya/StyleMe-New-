import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { SiteHeader } from '../components/layout/SiteHeader'
import { FlowProgress } from '../components/ui/FlowProgress'
import { Button } from '../components/ui/Button'
import { commitPromptToResult } from '../lib/commitPromptToResult'
import { useWizard } from '../context/useWizard'
import { paths } from './paths'
import { getNextWizardPath, getPreviousWizardPath, isWizardStepPath } from './wizard-flow'
import '../components/ui/ui.css'
import '../design-system/styleme-flow.css'

export function WizardLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const wizard = useWizard()
  const { imageUri, needsPhotoReminder, dismissPhotoBanner, setup, faceShape, prompt, selectedStylePill, setResultIdeas, resetWizard } =
    wizard

  const prev = getPreviousWizardPath(pathname)
  const showBack = prev !== null

  const showPhotoBanner =
    needsPhotoReminder &&
    !imageUri &&
    isWizardStepPath(pathname) &&
    pathname !== paths.setup &&
    pathname !== paths.capture

  const setupValid =
    setup.gender.trim().length > 0 &&
    setup.occasion.trim().length > 0 &&
    setup.hairLengthPref.trim().length > 0 &&
    setup.hairGoal.trim().length > 0

  const onHeaderNext = () => {
    if (pathname === paths.prompt) {
      commitPromptToResult({
        navigate,
        faceShape,
        setup,
        prompt,
        selectedStylePill,
        setResultIdeas,
      })
      return
    }
    if (pathname === paths.result) {
      resetWizard()
      navigate(paths.splash)
      return
    }
    const next = getNextWizardPath(pathname)
    if (next) navigate(next)
  }

  const nextDisabled =
    pathname === paths.setup
      ? !setupValid
      : pathname === paths.capture
        ? !imageUri
        : pathname === paths.faceShape
          ? !faceShape
          : pathname === paths.prompt
            ? !faceShape
            : false

  return (
    <div className="wizard-shell styleme-flow">
      <SiteHeader
        back={showBack && prev ? { onClick: () => navigate(prev) } : null}
        next={{ label: 'Next', onClick: onHeaderNext, disabled: nextDisabled }}
      />

      {showPhotoBanner ? (
        <div className="wizard-banner" role="status">
          <p>
            <strong>Photo not saved in the browser.</strong> Add a photo again on the Photo step to
            continue the flow.
          </p>
          <div className="wizard-banner-actions">
            <Button variant="secondary" className="wizard-banner-cta" onClick={() => navigate(paths.capture)}>
              Go to photo
            </Button>
            <button type="button" className="wizard-banner-dismiss" onClick={dismissPhotoBanner}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <FlowProgress />
      <div className="styleme-flow__stage">
        <Outlet />
      </div>
    </div>
  )
}
