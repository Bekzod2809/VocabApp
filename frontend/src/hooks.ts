import { useLiveQuery } from 'dexie-react-hooks'
import { db, getMeta, type Progress } from './db'

export function useDirtyCount(): number {
  return (
    useLiveQuery(async () => {
      const [groups, words, progress] = await Promise.all([
        db.groups.where('dirty').equals(1).count(),
        db.words.where('dirty').equals(1).count(),
        db.progress.where('dirty').equals(1).count(),
      ])
      return groups + words + progress
    }, []) ?? 0
  )
}

export function useMeta<T>(key: string): T | undefined {
  return useLiveQuery(() => getMeta<T>(key), [key])
}

export function useProgressMap(): Map<string, Progress> | undefined {
  return useLiveQuery(async () => {
    const all = await db.progress.toArray()
    return new Map(all.map((p) => [p.wordId, p]))
  }, [])
}
