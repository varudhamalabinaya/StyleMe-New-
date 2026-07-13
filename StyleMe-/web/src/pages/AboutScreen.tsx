import { useNavigate } from 'react-router-dom'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Screen } from '../components/ui/Screen'
import { paths } from '../routes/paths'
import '../design-system/styleme-entry.css'

export function AboutScreen() {
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
            <p className="styleme-entry__eyebrow">About the project</p>
            <h1 className="styleme-entry__title">StyleMe helps users preview hairstyle directions quickly.</h1>
            <p className="styleme-entry__text">
              StyleMe is a school project web app that takes a user photo, estimates face shape locally,
              and recommends diverse hairstyle ideas based on preferences like occasion, length, and styling
              goals.
            </p>
            <p className="styleme-entry__text">
              The app is designed for demo use: no production claims, no medical guidance, and a clear,
              simple flow from setup to personalized results.
            </p>
          </article>
        </main>
      </div>
    </Screen>
  )
}
