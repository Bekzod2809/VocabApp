import { ApiError, apiRequest, getServerUrl } from './api'
import { db, deleteMeta, getMeta, setMeta, type Group, type Progress, type Word } from './db'
import { normalizeIso, nowIso, toTime } from './utils'

export class AuthRequiredError extends Error {
  constructor() {
    super('Sinx qilish uchun tizimga kiring.')
  }
}

type GroupDto = Omit<Group, 'dirty'>
type WordDto = Omit<Word, 'dirty'>
type ProgressDto = Omit<Progress, 'dirty'>

interface SyncRequest {
  lastVersion: number
  groups: GroupDto[]
  words: WordDto[]
  progress: ProgressDto[]
}

interface SyncResponse {
  currentVersion: number
  groups: GroupDto[]
  words: WordDto[]
  progress: ProgressDto[]
}

export interface SyncResult {
  sent: number
  received: number
}

const stripDirty = <T extends { dirty: unknown }>({ dirty: _dirty, ...rest }: T) => rest

// Hamma narsani qayta yuborish uchun belgilaydi (server o'zgarganda yoki bazasi tozalanganda)
async function markAllDirty(): Promise<void> {
  await db.transaction('rw', db.groups, db.words, db.progress, db.meta, async () => {
    await db.groups.toCollection().modify({ dirty: 1 })
    await db.words.toCollection().modify({ dirty: 1 })
    await db.progress.toCollection().modify({ dirty: 1 })
    await deleteMeta('lastVersion')
  })
}

export async function resetSyncState(): Promise<void> {
  await markAllDirty()
}

export async function sync(): Promise<SyncResult> {
  try {
    return await syncOnce()
  } catch (error) {
    // Server bazasi yangidan yaratilgan bo'lsa: hamma narsani boshidan yuboramiz
    if (error instanceof ApiError && error.status === 400 && error.message.includes('LastVersion is ahead')) {
      await markAllDirty()
      return await syncOnce()
    }
    throw error
  }
}

async function syncOnce(): Promise<SyncResult> {
  const token = await getMeta<string>('token')
  if (!token) {
    throw new AuthRequiredError()
  }

  const serverUrl = await getServerUrl()
  const lastVersion = (await getMeta<number>('lastVersion')) ?? 0

  // Yuborilayotgan yozuvlarning nusxasi: javob kelguncha foydalanuvchi ularni yana o'zgartirishi mumkin
  const [groups, words, progress] = await Promise.all([
    db.groups.where('dirty').equals(1).toArray(),
    db.words.where('dirty').equals(1).toArray(),
    db.progress.where('dirty').equals(1).toArray(),
  ])

  const request: SyncRequest = {
    lastVersion,
    groups: groups.map(stripDirty),
    words: words.map(stripDirty),
    progress: progress.map(stripDirty),
  }

  let response: SyncResponse
  try {
    response = await apiRequest<SyncResponse>(serverUrl, '/api/sync', { method: 'POST', body: request, token })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await deleteMeta('token')
      throw new AuthRequiredError()
    }
    throw error
  }

  await db.transaction('rw', db.groups, db.words, db.progress, db.meta, async () => {
    // 1. Yuborilgan va shu orada o'zgarmagan yozuvlar endi "toza"
    for (const group of groups) {
      const current = await db.groups.get(group.id)
      if (current && current.updatedAt === group.updatedAt) await db.groups.update(group.id, { dirty: 0 })
    }
    for (const word of words) {
      const current = await db.words.get(word.id)
      if (current && current.updatedAt === word.updatedAt) await db.words.update(word.id, { dirty: 0 })
    }
    for (const item of progress) {
      const current = await db.progress.get(item.wordId)
      if (current && current.updatedAt === item.updatedAt) await db.progress.update(item.wordId, { dirty: 0 })
    }

    // 2. Serverdan kelganlarni yozamiz (agar telefondagi nusxa yangiroq bo'lmasa)
    for (const dto of response.groups) {
      const local = await db.groups.get(dto.id)
      const incoming = { ...dto, createdAt: normalizeIso(dto.createdAt), updatedAt: normalizeIso(dto.updatedAt) }
      if (local?.dirty && toTime(local.updatedAt) > toTime(incoming.updatedAt)) continue
      await db.groups.put({ ...incoming, dirty: 0 })
    }
    for (const dto of response.words) {
      const local = await db.words.get(dto.id)
      const incoming = { ...dto, createdAt: normalizeIso(dto.createdAt), updatedAt: normalizeIso(dto.updatedAt) }
      if (local?.dirty && toTime(local.updatedAt) > toTime(incoming.updatedAt)) continue
      await db.words.put({ ...incoming, dirty: 0 })
    }
    for (const dto of response.progress) {
      const local = await db.progress.get(dto.wordId)
      const incoming = { ...dto, nextReviewAt: normalizeIso(dto.nextReviewAt), updatedAt: normalizeIso(dto.updatedAt) }
      if (local?.dirty && toTime(local.updatedAt) > toTime(incoming.updatedAt)) continue
      await db.progress.put({ ...incoming, dirty: 0 })
    }

    // 3. Server bilgan o'chirilgan yozuvlarni telefondan butunlay olib tashlaymiz
    await db.groups.filter((g) => g.isDeleted && !g.dirty).delete()
    await db.words.filter((w) => w.isDeleted && !w.dirty).delete()
    const wordIds = new Set(await db.words.toCollection().primaryKeys())
    await db.progress.filter((p) => !p.dirty && !wordIds.has(p.wordId)).delete()

    await setMeta('lastVersion', response.currentVersion)
    await setMeta('lastSyncAt', nowIso())
  })

  return {
    sent: groups.length + words.length + progress.length,
    received: response.groups.length + response.words.length + response.progress.length,
  }
}
