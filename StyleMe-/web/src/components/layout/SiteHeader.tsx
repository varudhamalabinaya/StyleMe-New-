import { Link } from 'react-router-dom'
import '../../design-system/styleme-header.css'
import { paths } from '../../routes/paths'

function LogoMark() {
  return (
    <svg className="sm-header__mark" viewBox="0 0 32 32" aria-hidden>
      <path
        fill="currentColor"
        d="M16 2 27.3 8.5v15L16 30 4.7 23.5v-15L16 2z"
      />
    </svg>
  )
}

export type SiteHeaderNext = {
  label: string
  onClick: () => void
  disabled?: boolean
}

type Props = {
  homeTo?: string
  back?: { label?: string; onClick: () => void } | null
  next?: SiteHeaderNext | null
}

export function SiteHeader({ homeTo = paths.splash, back = null, next = null }: Props) {
  return (
    <header className="sm-header">
      <div className="sm-header__inner">
        <div className="sm-header__left">
          {back ? (
            <button type="button" className="sm-header__back" onClick={back.onClick}>
              {back.label ?? 'Back'}
            </button>
          ) : null}
          <Link to={homeTo} className="sm-header__brand">
            <LogoMark />
            <span className="sm-header__wordmark">StyleMe</span>
          </Link>
        </div>
        <div className="sm-header__right">
          {next ? (
            <button
              type="button"
              className="sm-header__next"
              onClick={next.onClick}
              disabled={next.disabled}
            >
              {next.label}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
