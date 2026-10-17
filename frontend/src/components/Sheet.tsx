import { useEffect, useRef, type ReactNode } from 'react'
import { CloseIcon } from './Icons'

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
}

// Pastdan chiqadigan oyna. Ochilganda tarixga yozuv qo'shadi:
// Android'da "orqaga" bosilsa ekran emas, faqat shu oyna yopiladi.
export function Sheet({ title, onClose, children }: SheetProps) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    let closedByBack = false
    history.pushState({ sheet: true }, '')

    const onPopState = () => {
      closedByBack = true
      onCloseRef.current()
    }
    window.addEventListener('popstate', onPopState)

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('keydown', onKey)
      if (!closedByBack) history.back()
    }
  }, [])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Yopish">
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
