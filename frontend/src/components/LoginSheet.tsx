import { useEffect, useState, type FormEvent } from 'react'
import { getServerUrl, normalizeServerUrl } from '../api'
import { fetchSetupStatus, signIn } from '../auth'
import { getMeta } from '../db'
import { closeLogin, runSync } from '../syncStore'
import { Sheet } from './Sheet'

export function LoginSheet() {
  const [serverUrl, setServerUrl] = useState('')
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  // null: hali bilinmaydi (server tekshirilmagan)
  const [isSetupDone, setIsSetupDone] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      const url = await getServerUrl()
      setServerUrl(url)
      setUserName((await getMeta<string>('userName')) ?? '')
      if (url) void checkServer(url)
    })()
  }, [])

  async function checkServer(url: string) {
    const normalized = normalizeServerUrl(url)
    if (!normalized) return
    setError('')
    try {
      setIsSetupDone(await fetchSetupStatus(normalized))
    } catch (e) {
      setIsSetupDone(null)
      setError(e instanceof Error ? e.message : "Serverga ulanib bo'lmadi")
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const url = normalizeServerUrl(serverUrl)
    if (!url || !userName.trim() || !password) return

    setBusy(true)
    setError('')
    try {
      const setupDone = isSetupDone ?? (await fetchSetupStatus(url))
      await signIn(url, userName, password, !setupDone)
      closeLogin()
      void runSync()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kirib bo\'lmadi')
    } finally {
      setBusy(false)
    }
  }

  const isSetup = isSetupDone === false

  return (
    <Sheet title={isSetup ? 'Hisob yaratish' : 'Kirish'} onClose={closeLogin}>
      <form className="form" onSubmit={handleSubmit}>
        {isSetup && (
          <p className="muted small">
            Serverda hali hisob yo'q. Login va parol o'ylab toping: ular faqat sizniki bo'ladi va keyin shu bilan kirasiz.
          </p>
        )}
        <label className="field">
          <span>Server manzili</span>
          <input
            value={serverUrl}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="http://192.168.1.10:5080"
            onChange={(event) => setServerUrl(event.target.value)}
            onBlur={() => void checkServer(serverUrl)}
          />
        </label>
        <label className="field">
          <span>Login</span>
          <input
            value={userName}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            onChange={(event) => setUserName(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Parol{isSetup && <span className="muted"> (kamida 8 belgi)</span>}</span>
          <input
            type="password"
            value={password}
            autoComplete={isSetup ? 'new-password' : 'current-password'}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="button primary" type="submit" disabled={busy || !serverUrl.trim() || !userName.trim() || !password}>
          {busy ? 'Kutilmoqda...' : isSetup ? 'Yaratish va sinx qilish' : 'Kirish va sinx qilish'}
        </button>
      </form>
    </Sheet>
  )
}
