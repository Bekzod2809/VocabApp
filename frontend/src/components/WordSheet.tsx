import { useRef, useState, type FormEvent } from 'react'
import type { Word } from '../db'
import { createWord, deleteWord, updateWord } from '../repo'
import { showToast } from '../syncStore'
import { Sheet } from './Sheet'

interface WordSheetProps {
  groupId: string
  word?: Word
  onClose: () => void
}

// word berilsa tahrirlash, aks holda yangi so'z qo'shish.
// Qo'shishda oyna yopilmaydi: ketma-ket ko'p so'z kiritish qulay bo'lsin.
export function WordSheet({ groupId, word, onClose }: WordSheetProps) {
  const [term, setTerm] = useState(word?.term ?? '')
  const [translation, setTranslation] = useState(word?.translation ?? '')
  const [example, setExample] = useState(word?.example ?? '')
  const [addedCount, setAddedCount] = useState(0)
  const termRef = useRef<HTMLInputElement>(null)

  const isValid = term.trim() !== '' && translation.trim() !== ''

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValid) return

    const input = { term, translation, example }
    if (word) {
      await updateWord(word.id, input)
      onClose()
      return
    }

    await createWord(groupId, input)
    setAddedCount((count) => count + 1)
    setTerm('')
    setTranslation('')
    setExample('')
    termRef.current?.focus()
  }

  async function handleDelete() {
    if (!word || !confirm(`"${word.term}" so'zini o'chirasizmi?`)) return
    await deleteWord(word.id)
    showToast("So'z o'chirildi")
    onClose()
  }

  return (
    <Sheet title={word ? "So'zni tahrirlash" : "Yangi so'z"} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>So'z</span>
          <input
            ref={termRef}
            autoFocus
            value={term}
            maxLength={200}
            placeholder="cat"
            autoCapitalize="none"
            onChange={(event) => setTerm(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Tarjima</span>
          <input
            value={translation}
            maxLength={500}
            placeholder="mushuk"
            onChange={(event) => setTranslation(event.target.value)}
          />
        </label>
        <label className="field">
          <span>
            Misol gap <span className="muted">(ixtiyoriy)</span>
          </span>
          <textarea
            value={example}
            maxLength={1000}
            rows={2}
            placeholder="The cat is sleeping."
            onChange={(event) => setExample(event.target.value)}
          />
        </label>

        <button className="button primary" type="submit" disabled={!isValid}>
          {word ? 'Saqlash' : "Qo'shish"}
        </button>

        {!word && addedCount > 0 && (
          <button className="button" type="button" onClick={onClose}>
            Tayyor · {addedCount} ta qo'shildi
          </button>
        )}

        {word && (
          <button className="button danger-text" type="button" onClick={handleDelete}>
            O'chirish
          </button>
        )}
      </form>
    </Sheet>
  )
}
