import { useMemo, useState } from 'react'
import { bulkCreateWords, parseBulk } from '../repo'
import { showToast } from '../syncStore'
import { Sheet } from './Sheet'

interface BulkSheetProps {
  groupId: string
  onClose: () => void
}

export function BulkSheet({ groupId, onClose }: BulkSheetProps) {
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseBulk(text), [text])

  async function handleAdd() {
    if (parsed.length === 0) return
    await bulkCreateWords(groupId, parsed)
    showToast(`${parsed.length} ta so'z qo'shildi`)
    onClose()
  }

  return (
    <Sheet title="Ko'plab qo'shish" onClose={onClose}>
      <div className="form">
        <p className="muted small">
          Har bir qatorga bitta so'z: <code>so'z - tarjima - misol gap</code>. Misol gap ixtiyoriy.
        </p>
        <textarea
          autoFocus
          className="bulk-input"
          rows={8}
          value={text}
          placeholder={'cat - mushuk - The cat is sleeping.\ndog - it\nbird - qush'}
          autoCapitalize="none"
          onChange={(event) => setText(event.target.value)}
        />
        <button className="button primary" onClick={handleAdd} disabled={parsed.length === 0}>
          {parsed.length === 0 ? "So'z topilmadi" : `${parsed.length} ta so'zni qo'shish`}
        </button>
      </div>
    </Sheet>
  )
}
