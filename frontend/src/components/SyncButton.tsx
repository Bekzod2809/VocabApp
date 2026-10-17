import { useDirtyCount } from '../hooks'
import { runSync, useSyncState } from '../syncStore'
import { SyncIcon } from './Icons'

export function SyncButton() {
  const { syncing } = useSyncState()
  const dirtyCount = useDirtyCount()

  return (
    <button
      className="icon-button sync-button"
      onClick={runSync}
      disabled={syncing}
      aria-label={dirtyCount > 0 ? `Sinx qilish, ${dirtyCount} ta o'zgarish yuborilmagan` : 'Sinx qilish'}
    >
      <SyncIcon spinning={syncing} />
      {dirtyCount > 0 && <span className="badge">{dirtyCount > 99 ? '99+' : dirtyCount}</span>}
    </button>
  )
}
