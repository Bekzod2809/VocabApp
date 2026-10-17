import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { BulkSheet } from '../components/BulkSheet'
import { GroupNameSheet } from '../components/GroupNameSheet'
import { Header } from '../components/Header'
import { MoreIcon, PlusIcon } from '../components/Icons'
import { Sheet } from '../components/Sheet'
import { WordSheet } from '../components/WordSheet'
import { db, type Word } from '../db'
import { useProgressMap } from '../hooks'
import { isDue, MAX_BOX } from '../leitner'
import { deleteGroup, renameGroup } from '../repo'
import { afterHistoryBack, goBack, navigate } from '../router'
import { showToast } from '../syncStore'

type Dialog = { kind: 'add' } | { kind: 'edit'; word: Word } | { kind: 'bulk' } | { kind: 'menu' } | { kind: 'rename' }

export function GroupScreen({ groupId }: { groupId: string }) {
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [search, setSearch] = useState('')

  const group = useLiveQuery(() => db.groups.get(groupId), [groupId])
  const words = useLiveQuery(
    () =>
      db.words
        .where('groupId')
        .equals(groupId)
        .filter((w) => !w.isDeleted)
        .toArray()
        .then((list) => list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    [groupId],
  )
  const progressMap = useProgressMap()

  const dueCount = useMemo(() => {
    if (!words || !progressMap) return 0
    const now = Date.now()
    return words.filter((w) => isDue(progressMap.get(w.id), now)).length
  }, [words, progressMap])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!words || !query) return words
    return words.filter((w) => w.term.toLowerCase().includes(query) || w.translation.toLowerCase().includes(query))
  }, [words, search])

  if (group === undefined && words === undefined) {
    return null
  }

  if (!group || group.isDeleted) {
    return (
      <div className="screen">
        <Header title="Guruh" back />
        <main className="content">
          <div className="empty">
            <p className="empty-title">Guruh topilmadi</p>
            <p className="muted">U o'chirilgan bo'lishi mumkin.</p>
          </div>
        </main>
      </div>
    )
  }

  const total = words?.length ?? 0

  async function handleDelete() {
    if (!group || !confirm(`"${group.name}" guruhi va undagi ${total} ta so'z o'chirilsinmi?`)) return
    await deleteGroup(group.id)
    setDialog(null)
    showToast("Guruh o'chirildi")
    // Sheet yopilib tarix joyiga tushgach, bosh sahifaga qaytamiz
    afterHistoryBack(() => goBack())
  }

  return (
    <div className="screen">
      <Header
        title={group.name}
        back
        actions={
          <button className="icon-button" onClick={() => setDialog({ kind: 'menu' })} aria-label="Guruh amallari">
            <MoreIcon />
          </button>
        }
      />

      <main className="content">
        {total > 0 && (
          <div className="study-start">
            {dueCount > 0 ? (
              <button className="button primary large" onClick={() => navigate(`/g/${group.id}/study`)}>
                Boshlash · {dueCount} ta so'z
              </button>
            ) : (
              <div className="done-note">
                <p>Hozircha takrorlaydigan so'z yo'q.</p>
                <p className="muted small">Yodlangan so'zlar belgilangan kunda yana chiqadi.</p>
              </div>
            )}
            <button className="button" onClick={() => navigate(`/g/${group.id}/study/all`)}>
              Hammasini takrorlash ({total})
            </button>
          </div>
        )}

        {total > 8 && (
          <input
            className="search"
            type="search"
            placeholder="Qidirish..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        )}

        {total === 0 && (
          <div className="empty">
            <p className="empty-title">Guruh bo'sh</p>
            <p className="muted">Pastdagi tugma bilan so'z qo'shing yoki ro'yxatni bir yo'la tashlang.</p>
          </div>
        )}

        <ul className="list words">
          {filtered?.map((word) => {
            const box = progressMap?.get(word.id)?.box ?? 0
            return (
              <li key={word.id}>
                <button className="word-row" onClick={() => setDialog({ kind: 'edit', word })}>
                  <span className="word-texts">
                    <span className="word-term">{word.term}</span>
                    <span className="muted">{word.translation}</span>
                  </span>
                  <span className="boxes" aria-label={`${box}-quti`}>
                    {Array.from({ length: MAX_BOX }, (_, i) => (
                      <span key={i} className={i < box ? 'dot on' : 'dot'} />
                    ))}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </main>

      <div className="bottom-bar two">
        <button className="button" onClick={() => setDialog({ kind: 'bulk' })}>
          Ko'plab qo'shish
        </button>
        <button className="button primary" onClick={() => setDialog({ kind: 'add' })}>
          <PlusIcon /> So'z
        </button>
      </div>

      {dialog?.kind === 'add' && <WordSheet groupId={group.id} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'edit' && <WordSheet groupId={group.id} word={dialog.word} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'bulk' && <BulkSheet groupId={group.id} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'rename' && (
        <GroupNameSheet
          title="Nomini o'zgartirish"
          initialName={group.name}
          submitLabel="Saqlash"
          onSubmit={(name) => renameGroup(group.id, name)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'menu' && (
        <Sheet title={group.name} onClose={() => setDialog(null)}>
          <div className="form">
            <button
              className="button"
              onClick={() => {
                setDialog(null)
                // Oldingi oyna tarixdan chiqib ketgach keyingisini ochamiz
                afterHistoryBack(() => setDialog({ kind: 'rename' }))
              }}
            >
              Nomini o'zgartirish
            </button>
            <button className="button danger-text" onClick={handleDelete}>
              Guruhni o'chirish
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
