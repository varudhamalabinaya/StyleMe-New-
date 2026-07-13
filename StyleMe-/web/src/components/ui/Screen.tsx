import type { ReactNode } from 'react'
import './ui.css'

type Props = {
  children: ReactNode
  wide?: boolean
  center?: boolean
  full?: boolean
}

export function Screen({ children, wide, center, full }: Props) {
  const classes = [
    'ui-screen',
    wide && 'ui-screen--wide',
    center && 'ui-screen--center',
    full && 'ui-screen--full',
  ]
    .filter(Boolean)
    .join(' ')
  return <main className={classes}>{children}</main>
}
