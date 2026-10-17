import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { GroupNameSheet } from '../components/GroupNameSheet'
import { Header } from '../components/Header'
import { PlusIcon, SettingsIcon } from '../components/Icons'
import { SyncButton } from '../components/SyncButton'
import { db } from '../db'
import { useMeta, useProgressMap } from '../hooks'
import { isDue, LEARNED_BOX } from '../leitner'
import { createGroup } from '../repo'
import { navigate } from '../router'
import { timeAgo } from '../utils'

interface GroupStats {
  total: number
  learned: number
  due: number
}

export function GroupsScreen() {
  const [creating, setCreating] = useState(false)

  const groups = useLiveQuery(
    () => db.groups.filter((g) => !g.isDeleted).toArray().then((list) => list.sort((a, b) => a.name.localeCompare(b.name))),
    [],
  )
  const words = useLiveQuery(() => db.words.filter((w) => !w.isDeleted).toArray(), [])
  const progressMap = useProgressMap()
  const lastSyncAt = useMeta<string>('lastSyncAt')

  const stats = useMemo(() => {
    const result = new Map<string, GroupStats>()
    if (!words || !progressMap) return result

    const now = Date.now()
    for (const word of words) {
      const item = result.get(word.groupId) ?? { total: 0, learned: 0, due: 0 }
      const progress = progressMap.get(word.id)
      item.total++
      if (progress && progress.box >= LEARNED_BOX) item.learned++
      if (isDue(progress, now)) item.due++
      result.set(word.groupId, item)
    }
    return result
  }, [words, progressMap])

  return (
    <div className="screen">
      <Header
        title="So'zlar"
        actions={
          <>
            <SyncButton />
            <button className="icon-button" onClick={() => navigate('/settings')} aria-label="Sozlamalar">
              <SettingsIcon />
            </button>
          </>
        }
      />

      <main className="content">
        <p className="muted small">Oxirgi sinx: {timeAgo(lastSyncAt)}</p>

        {groups && groups.length === 0 && (
          <div className="empty">
            <p className="empty-title">Hali guruh yo'q</p>
            <p className="muted">
              Birinchi guruhni yarating, masalan <b>Animals</b>. Yoki serverda so'zlar bo'lsa, yuqoridagi sinx tugmasini bosing.
            </p>
          </div>
        )}

        <ul className="list">
          {groups?.map((group) => {
            const item = stats.get(group.id) ?? { total: 0, learned: 0, due: 0 }
            const percent = item.total === 0 ? 0 : Math.round((item.learned / item.total) * 100)
            return (
              <li key={group.id}>
                <button className="card group-card" onClick={() => navigate(`/g/${group.id}`)}>
                  <div className="group-card-top">
                    <span className="group-name">{group.name}</span>
                    {item.due > 0 && <span className="pill">{item.due} takrorlash</span>}
                  </div>
                  <span className="muted small">
                    {item.total} so'z · {item.learned} yodlangan
                  </span>
                  <div className="bar" aria-hidden>
                    <div className="bar-fill" style={{ width: `${percent}%` }} />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </main>

      <div className="bottom-bar">
        <button className="button primary" onClick={() => setCreating(true)}>
          <PlusIcon /> Yangi guruh
        </button>
      </div>

      {creating && (
        <GroupNameSheet
          title="Yangi guruh"
          submitLabel="Yaratish"
          onSubmit={async (name) => {
            await createGroup(name)
          }}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  )
}
