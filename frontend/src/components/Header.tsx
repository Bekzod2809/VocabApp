import type { ReactNode } from 'react'
import { goBack } from '../router'
import { BackIcon } from './Icons'

interface HeaderProps {
  title: string
  back?: boolean
  actions?: ReactNode
}

export function Header({ title, back = false, actions }: HeaderProps) {
  return (
    <header className="header">
      {back && (
        <button className="icon-button" onClick={() => goBack()} aria-label="Orqaga">
          <BackIcon />
        </button>
      )}
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">{actions}</div>
    </header>
  )
}
