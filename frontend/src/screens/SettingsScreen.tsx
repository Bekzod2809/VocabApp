import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { getServerUrl, normalizeServerUrl } from '../api'
import { signOut } from '../auth'
import { Header } from '../components/Header'
import { db, setMeta } from '../db'
import { useDirtyCount, useMeta } from '../hooks'
import { resetSyncState } from '../sync'
import { openLogin, runSync, showToast } from '../syncStore'
import { timeAgo } from '../utils'

export function SettingsScreen() {
  const token = useMeta<string>('token')
  const userName = useMeta<string>('userName')
  const lastSyncAt = useMeta<string>('lastSyncAt')
  const dirtyCount = useDirtyCount()
  const counts = useLiveQuery(async () => {
    const [groups, words] = await Promise.all([
      db.groups.filter((g) => !g.isDeleted).count(),
      db.words.filter((w) => !w.isDeleted).count(),
    ])
    return { groups, words }
  }, [])

  const [serverUrl, setServerUrl] = useState('')
  const [savedServerUrl, setSavedServerUrl] = useState('')

  useEffect(() => {
    void getServerUrl().then((url) => {
      setServerUrl(url)
      setSavedServerUrl(url)
    })
  }, [])

  async function saveServer() {
    const url = normalizeServerUrl(serverUrl)
    if (!url || url === savedServerUrl) return
    // Yangi server: token u yerda ishlamaydi, qaytadan kirish kerak
    await setMeta('serverUrl', url)
    await signOut()
    await resetSyncState()
    setServerUrl(url)
    setSavedServerUrl(url)
    showToast('Server manzili saqlandi. Sinx uchun qaytadan kiring.')
  }

  async function handleSignOut() {
    if (!confirm("Hisobdan chiqasizmi? Telefondagi so'zlar o'chmaydi.")) return
    await signOut()
    showToast('Hisobdan chiqildi')
  }

  async function handleResend() {
    if (!confirm("Telefondagi hamma so'zlar serverga qaytadan yuborilsinmi?")) return
    await resetSyncState()
    void runSync()
  }

  return (
    <div className="screen">
      <Header title="Sozlamalar" back />

      <main className="content">
        <section className="section">
          <h2 className="section-title">Hisob</h2>
          <div className="card">
            {token ? (
              <>
                <p>
                  <b>{userName}</b>
                </p>
                <p className="muted small">Oxirgi sinx: {timeAgo(lastSyncAt)}</p>
                <button className="button" onClick={handleSignOut}>
                  Chiqish
                </button>
              </>
            ) : (
              <>
                <p className="muted">Kirilmagan. Ilova internetsiz ham ishlaydi, kirish faqat sinx uchun kerak.</p>
                <button className="button primary" onClick={openLogin}>
                  Kirish
                </button>
              </>
            )}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Server</h2>
          <div className="card form">
            <label className="field">
              <span>Server manzili</span>
              <input
                value={serverUrl}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="http://192.168.1.10:5080"
                onChange={(event) => setServerUrl(event.target.value)}
              />
            </label>
            <button
              className="button"
              onClick={saveServer}
              disabled={!serverUrl.trim() || normalizeServerUrl(serverUrl) === savedServerUrl}
            >
              Saqlash
            </button>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Ma'lumotlar</h2>
          <div className="card">
            <p>
              {counts?.groups ?? 0} guruh · {counts?.words ?? 0} so'z
            </p>
            <p className="muted small">
              {dirtyCount > 0 ? `${dirtyCount} ta o'zgarish serverga yuborilmagan` : 'Hammasi serverga yuborilgan'}
            </p>
            <button className="button" onClick={handleResend} disabled={!token}>
              Hammasini qayta yuborish
            </button>
          </div>
        </section>

        <p className="muted small center">VocabApp {__APP_VERSION__}</p>
      </main>
    </div>
  )
}
