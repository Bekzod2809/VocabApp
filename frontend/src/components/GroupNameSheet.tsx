import { useState, type FormEvent } from 'react'
import { Sheet } from './Sheet'

interface GroupNameSheetProps {
  title: string
  initialName?: string
  submitLabel: string
  onSubmit: (name: string) => Promise<void>
  onClose: () => void
}

export function GroupNameSheet({ title, initialName = '', submitLabel, onSubmit, onClose }: GroupNameSheetProps) {
  const [name, setName] = useState(initialName)
  const trimmed = name.trim()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!trimmed) return
    await onSubmit(trimmed)
    onClose()
  }

  return (
    <Sheet title={title} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nomi</span>
          <input
            autoFocus
            value={name}
            maxLength={100}
            placeholder="Masalan: Animals"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button className="button primary" type="submit" disabled={!trimmed}>
          {submitLabel}
        </button>
      </form>
    </Sheet>
  )
}
