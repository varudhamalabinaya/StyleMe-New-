import type { ReactNode } from 'react'
import './ui.css'

type Props = {
  title: string
  description: string
  imageUrl?: string | null
  confidence?: number
  tags?: string[]
  maintenanceLevel?: number
  dailyStyling?: string
  className?: string
}

export function Card({
  title,
  description,
  imageUrl,
  confidence,
  tags,
  maintenanceLevel,
  dailyStyling,
  className = '',
}: Props) {
  const meter = Math.max(0, Math.min(100, confidence ?? 85))
  const maintain = Math.max(1, Math.min(3, maintenanceLevel ?? 2))
  return (
    <article className={`ui-card ${className}`.trim()}>
      {imageUrl ? <img src={imageUrl} alt="" className="ui-card-media" /> : null}
      <h3 className="ui-card-title">{title}</h3>
      <p className="ui-card-desc">{description}</p>
      <div className="ui-card-confidence">
        <div className="ui-card-confidence-row">
          <span>AI confidence</span>
          <strong>{meter}%</strong>
        </div>
        <div className="ui-card-meter">
          <div className="ui-card-meter-fill" style={{ width: `${meter}%` }} />
        </div>
      </div>
      {tags?.length ? (
        <div className="ui-card-tags">
          {tags.map((tag) => (
            <span key={tag} className="ui-card-tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <p className="ui-card-maintenance">
        Maintenance:{' '}
        <span className="ui-card-dots" aria-label={`${maintain} out of 3`}>
          {[0, 1, 2].map((idx) => (
            <span key={idx} className={idx < maintain ? 'is-active' : ''} />
          ))}
        </span>
      </p>
      <p className="ui-card-time">Daily styling: {dailyStyling ?? '8-12 min'}</p>
    </article>
  )
}

export function CardList({ children }: { children: ReactNode }) {
  return <div className="ui-result-grid">{children}</div>
}
