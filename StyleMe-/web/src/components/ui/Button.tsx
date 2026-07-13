import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './ui.css'

type Variant = 'primary' | 'secondary' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  const v = variant === 'primary' ? 'ui-btn--primary' : variant === 'secondary' ? 'ui-btn--secondary' : 'ui-btn--ghost'
  return (
    <button type="button" className={`ui-btn ${v} ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}
