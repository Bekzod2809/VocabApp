import { db, type Word } from './db'
import { nextProgress } from './leitner'
import { nowIso, uuid } from './utils'

// Hamma o'zgarishlar avval telefonning o'ziga yoziladi (dirty = 1),
// keyin "Sinx" tugmasi bosilganda serverga yuboriladi.

export async function createGroup(name: string): Promise<string> {
  const now = nowIso()
  const id = uuid()
  await db.groups.add({ id, name: name.trim(), createdAt: now, updatedAt: now, isDeleted: false, dirty: 1 })
  return id
}

export async function renameGroup(id: string, name: string): Promise<void> {
  await db.groups.update(id, { name: name.trim(), updatedAt: nowIso(), dirty: 1 })
}

export async function deleteGroup(id: string): Promise<void> {
  const now = nowIso()
  await db.transaction('rw', db.groups, db.words, async () => {
    await db.groups.update(id, { isDeleted: true, updatedAt: now, dirty: 1 })
    await db.words
      .where('groupId')
      .equals(id)
      .modify({ isDeleted: true, updatedAt: now, dirty: 1 })
  })
}

export interface WordInput {
  term: string
  translation: string
  example: string
}

const cleanExample = (example: string) => (example.trim() === '' ? null : example.trim())

export async function createWord(groupId: string, input: WordInput): Promise<void> {
  const now = nowIso()
  await db.words.add({
    id: uuid(),
    groupId,
    term: input.term.trim(),
    translation: input.translation.trim(),
    example: cleanExample(input.example),
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    dirty: 1,
  })
}

export async function updateWord(id: string, input: WordInput): Promise<void> {
  await db.words.update(id, {
    term: input.term.trim(),
    translation: input.translation.trim(),
    example: cleanExample(input.example),
    updatedAt: nowIso(),
    dirty: 1,
  })
}

export async function deleteWord(id: string): Promise<void> {
  await db.words.update(id, { isDeleted: true, updatedAt: nowIso(), dirty: 1 })
}

// Har bir qator: "cat - mushuk - The cat is sleeping." (misol ixtiyoriy).
// Ajratuvchi: " - ", tab yoki ";"
export function parseBulk(text: string): WordInput[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+[-–—]\s+|\t|;/).map((part) => part.trim()))
    .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
    .map(([term, translation, ...rest]) => ({ term, translation, example: rest.join(' - ') }))
}

export async function bulkCreateWords(groupId: string, inputs: WordInput[]): Promise<void> {
  const base = Date.now()
  const words: Word[] = inputs.map((input, index) => {
    // Har biriga 1 ms farq: ro'yxatda kiritilgan tartibda turadi
    const time = new Date(base + index).toISOString()
    return {
      id: uuid(),
      groupId,
      term: input.term.trim(),
      translation: input.translation.trim(),
      example: cleanExample(input.example),
      createdAt: time,
      updatedAt: time,
      isDeleted: false,
      dirty: 1,
    }
  })
  await db.words.bulkAdd(words)
}

export async function recordAnswer(wordId: string, correct: boolean): Promise<void> {
  await db.transaction('rw', db.progress, async () => {
    const prev = await db.progress.get(wordId)
    await db.progress.put(nextProgress(wordId, prev, correct))
  })
}
