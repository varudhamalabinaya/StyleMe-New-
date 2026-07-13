import { useNavigate } from 'react-router-dom'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Screen } from '../components/ui/Screen'
import { paths } from '../routes/paths'
import '../design-system/styleme-entry.css'

export function SupportScreen() {
  const navigate = useNavigate()

  return (
    <Screen full>
      <div className="styleme-entry">
        <SiteHeader
          back={null}
          next={{ label: 'Next', onClick: () => navigate(paths.splash) }}
        />

        <main className="styleme-entry__main">
          <article className="styleme-entry__card styleme-entry__card--article">
            <p className="styleme-entry__eyebrow">Support</p>
            <h1 className="styleme-entry__title">Need help with your StyleMe demo?</h1>
            <p className="styleme-entry__text">
              If suggestions look unexpected, retake your photo in clear lighting and keep your face centered.
              For better recommendations, complete setup fields carefully and add a short style prompt before
              results.
            </p>
            <p className="styleme-entry__text">
              This project is a demo build, so outputs are guidance only. If the app feels stuck, refresh the
              page and start a new session from home.
            </p>
            <p className="styleme-entry__text">
              For presentation: explain flow as Setup → Photo → Face Shape → Prompt → Results, and highlight
              that face-shape detection and recommendation scoring run in the app.
            </p>
          </article>
        </main>
      </div>
    </Screen>
  )
}
