import Dexie, { type EntityTable } from 'dexie'

// dirty = 1: telefonda o'zgargan, hali serverga yuborilmagan
// (IndexedDB boolean'ni indekslay olmaydi, shuning uchun 0/1)
export type Dirty = 0 | 1

export interface Group {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  dirty: Dirty
}

export interface Word {
  id: string
  groupId: string
  term: string
  translation: string
  example: string | null
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  dirty: Dirty
}

export interface Progress {
  wordId: string
  box: number
  nextReviewAt: string
  correctCount: number
  wrongCount: number
  updatedAt: string
  dirty: Dirty
}

export interface Meta {
  key: string
  value: unknown
}

export const db = new Dexie('vocabapp') as Dexie & {
  groups: EntityTable<Group, 'id'>
  words: EntityTable<Word, 'id'>
  progress: EntityTable<Progress, 'wordId'>
  meta: EntityTable<Meta, 'key'>
}

db.version(1).stores({
  groups: 'id, dirty',
  words: 'id, groupId, dirty',
  progress: 'wordId, dirty',
  meta: 'key',
})

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await db.meta.get(key)
  return row?.value as T | undefined
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value })
}

export async function deleteMeta(key: string): Promise<void> {
  await db.meta.delete(key)
}
