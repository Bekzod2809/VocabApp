import { useSyncExternalStore } from 'react'
import { AuthRequiredError, sync } from './sync'

// Sinx holati butun ilova uchun bitta: tugma, xabar va login oynasi shu yerdan boshqariladi

export interface Toast {
  text: string
  kind: 'success' | 'error'
}

interface SyncState {
  syncing: boolean
  toast: Toast | null
  loginOpen: boolean
}

let state: SyncState = { syncing: false, toast: null, loginOpen: false }
const listeners = new Set<() => void>()
let toastTimer: ReturnType<typeof setTimeout> | undefined

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(subscribe, () => state)
}

export function showToast(text: string, kind: Toast['kind'] = 'success') {
  clearTimeout(toastTimer)
  setState({ toast: { text, kind } })
  toastTimer = setTimeout(() => setState({ toast: null }), 3500)
}

export function openLogin() {
  setState({ loginOpen: true })
}

export function closeLogin() {
  setState({ loginOpen: false })
}

export async function runSync(): Promise<void> {
  if (state.syncing) return

  setState({ syncing: true })
  try {
    const result = await sync()
    showToast(
      result.sent + result.received === 0
        ? "Hammasi bir xil, o'zgarish yo'q"
        : `Sinx tugadi: ${result.sent} ta yuborildi, ${result.received} ta olindi`,
    )
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      openLogin()
    } else {
      showToast(error instanceof Error ? error.message : 'Nimadir xato ketdi', 'error')
    }
  } finally {
    setState({ syncing: false })
  }
}
