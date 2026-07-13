import { STYLE_PILLS } from '../../lib/styleIdeas'
import './ui.css'

type Props = {
  value: string | null
  onChange: (pill: string | null) => void
}

export function StylePills({ value, onChange }: Props) {
  return (
    <div>
      <p className="ui-label ui-label--pills" id="style-pills-label">
        Style suggestions
      </p>
      <div className="ui-row" role="group" aria-labelledby="style-pills-label">
        {STYLE_PILLS.map((pill) => {
          const active = value === pill
          return (
            <button
              key={pill}
              type="button"
              className={`ui-pill ${active ? 'ui-pill--active' : ''}`}
              onClick={() => onChange(active ? null : pill)}
              aria-pressed={active}
            >
              {pill}
            </button>
          )
        })}
      </div>
    </div>
  )
}
