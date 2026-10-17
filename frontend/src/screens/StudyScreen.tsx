import { useCallback, useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { SwapIcon } from '../components/Icons'
import { db, type Word } from '../db'
import { isDue } from '../leitner'
import { recordAnswer } from '../repo'
import { goBack } from '../router'
import { shuffle } from '../utils'

type Direction = 'term' | 'translation'

const DIRECTION_KEY = 'vocab.direction'

function loadDirection(): Direction {
  try {
    return localStorage.getItem(DIRECTION_KEY) === 'translation' ? 'translation' : 'term'
  } catch {
    return 'term'
  }
}

interface Session {
  groupName: string
  queue: Word[]
}

export function StudyScreen({ groupId, all }: { groupId: string; all: boolean }) {
  const [session, setSession] = useState<Session | null>(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [retried, setRetried] = useState<Set<string>>(() => new Set())
  const [direction, setDirection] = useState<Direction>(loadDirection)

  // Sessiya boshida so'zlar bir marta olinadi: javob berilayotganda navbat o'zgarib ketmasin
  const start = useCallback(async () => {
    const [group, words, progress] = await Promise.all([
      db.groups.get(groupId),
      db.words.where('groupId').equals(groupId).filter((w) => !w.isDeleted).toArray(),
      db.progress.toArray(),
    ])
    const progressMap = new Map(progress.map((p) => [p.wordId, p]))
    const now = Date.now()
    const queue = all ? words : words.filter((w) => isDue(progressMap.get(w.id), now))

    setSession({ groupName: group?.name ?? '', queue: shuffle(queue) })
    setIndex(0)
    setFlipped(false)
    setCorrect(0)
    setWrong(0)
    setRetried(new Set())
  }, [groupId, all])

  useEffect(() => {
    void start()
  }, [start])

  const current = session?.queue[index]
  const finished = session !== null && index >= session.queue.length

  const answer = useCallback(
    async (isCorrect: boolean) => {
      if (!current || !session) return

      await recordAnswer(current.id, isCorrect)

      if (isCorrect) {
        setCorrect((n) => n + 1)
      } else {
        setWrong((n) => n + 1)
        // Xato topilgan so'z sessiya oxirida yana bir marta chiqadi
        if (!retried.has(current.id)) {
          setRetried((set) => new Set(set).add(current.id))
          setSession({ ...session, queue: [...session.queue, current] })
        }
      }
      setFlipped(false)
      setIndex((i) => i + 1)
    },
    [current, session, retried],
  )

  // Kompyuterda: Space - aylantirish, ← - bilmayman, → - bilaman
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!current) return
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setFlipped((f) => !f)
      } else if (flipped && event.key === 'ArrowLeft') {
        void answer(false)
      } else if (flipped && event.key === 'ArrowRight') {
        void answer(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, flipped, answer])

  function toggleDirection() {
    const next: Direction = direction === 'term' ? 'translation' : 'term'
    setDirection(next)
    setFlipped(false)
    try {
      localStorage.setItem(DIRECTION_KEY, next)
    } catch {
      // Saqlab bo'lmasa ham ishlayveradi
    }
  }

  if (!session) return null

  const total = session.queue.length
  const front = current && (direction === 'term' ? current.term : current.translation)
  const back = current && (direction === 'term' ? current.translation : current.term)

  return (
    <div className="screen study">
      <Header
        title={session.groupName}
        back
        actions={
          <button className="icon-button" onClick={toggleDirection} aria-label="Yo'nalishni almashtirish">
            <SwapIcon />
          </button>
        }
      />

      <main className="content study-content">
        {total === 0 && (
          <div className="empty">
            <p className="empty-title">Takrorlaydigan so'z yo'q</p>
            <p className="muted">Hammasi o'z vaqtida takrorlangan. Keyinroq qayting.</p>
            <button className="button" onClick={() => goBack()}>
              Orqaga
            </button>
          </div>
        )}

        {finished && total > 0 && (
          <div className="empty">
            <p className="empty-title">Tugadi!</p>
            <p className="result">
              <span className="success-text">{correct} to'g'ri</span> · <span className="danger-text">{wrong} xato</span>
            </p>
            <div className="form">
              <button className="button primary" onClick={() => void start()}>
                Yana bir bor
              </button>
              <button className="button" onClick={() => goBack()}>
                Guruhga qaytish
              </button>
            </div>
          </div>
        )}

        {current && (
          <>
            <div className="bar" aria-label={`${index + 1} / ${total}`}>
              <div className="bar-fill" style={{ width: `${(index / total) * 100}%` }} />
            </div>
            <p className="muted small center">
              {index + 1} / {total} · {direction === 'term' ? 'EN → UZ' : 'UZ → EN'}
            </p>

            <button className={flipped ? 'flashcard flipped' : 'flashcard'} onClick={() => setFlipped((f) => !f)}>
              <span className="flashcard-front">{front}</span>
              {flipped ? (
                <>
                  <span className="flashcard-divider" />
                  <span className="flashcard-back">{back}</span>
                  {current.example && <span className="flashcard-example">{current.example}</span>}
                </>
              ) : (
                <span className="muted small">bosing — javobni ko'rish</span>
              )}
            </button>
          </>
        )}
      </main>

      {current && (
        <div className="bottom-bar two">
          {flipped ? (
            <>
              <button className="button answer wrong" onClick={() => void answer(false)}>
                Bilmayman
              </button>
              <button className="button answer right" onClick={() => void answer(true)}>
                Bilaman
              </button>
            </>
          ) : (
            <button className="button primary span-2" onClick={() => setFlipped(true)}>
              Javobni ko'rish
            </button>
          )}
        </div>
      )}
    </div>
  )
}
