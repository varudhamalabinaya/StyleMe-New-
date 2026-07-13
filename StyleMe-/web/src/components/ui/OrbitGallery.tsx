import type { CSSProperties } from 'react'
import { SLIDEZ_ORBIT_ANGLES_DEG } from '../../lib/slidezOrbit'
import './ui.css'

type Props = {
  imageSrc: string
  /** Accessible label for the decorative ring */
  label?: string
}

/**
 * Radial frame layout derived from Slidez Figma export (rotated phone-style tiles on a ring).
 */
export function OrbitGallery({ imageSrc, label = 'Your photo in style directions' }: Props) {
  return (
    <figure className="ui-orbit" aria-label={label}>
      <div className="ui-orbit-ring" aria-hidden>
        {SLIDEZ_ORBIT_ANGLES_DEG.map((deg, i) => (
          <div
            key={i}
            className="ui-orbit-slot"
            style={{ '--orbit-angle': `${deg}deg` } as CSSProperties}
          >
            <div className="ui-orbit-tile">
              <img src={imageSrc} alt="" className="ui-orbit-img" draggable={false} />
            </div>
          </div>
        ))}
      </div>
      <figcaption className="ui-orbit-caption ui-sr-only">{label}</figcaption>
    </figure>
  )
}
