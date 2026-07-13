import { useLocation } from 'react-router-dom'
import { paths } from '../../routes/paths'
import { wizardStepPaths } from '../../routes/wizard-flow'
import '../../design-system/styleme-stepper.css'

const STEP_LABELS: Record<string, string> = {
  [paths.setup]: 'Setup',
  [paths.capture]: 'Photo',
  [paths.faceShape]: 'Shape',
  [paths.prompt]: 'Style',
  [paths.result]: 'Results',
}

export function FlowProgress() {
  const { pathname } = useLocation()
  if (pathname === paths.splash) return null

  const idx = wizardStepPaths.indexOf(pathname as (typeof wizardStepPaths)[number])
  if (idx < 0) return null

  return (
    <nav className="sm-stepper" aria-label="Wizard progress">
      <ol className="sm-stepper__list">
        {wizardStepPaths.map((step, i) => {
          const done = i < idx
          const current = i === idx
          const label = STEP_LABELS[step] ?? step
          return (
            <li
              key={step}
              className={[
                'sm-stepper__item',
                done ? 'is-done' : '',
                current ? 'is-current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={current ? 'step' : undefined}
            >
              <div className="sm-stepper__axis">
                {current ? <span className="sm-stepper__dot" aria-hidden /> : null}
              </div>
              <span className="sm-stepper__label">{label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
