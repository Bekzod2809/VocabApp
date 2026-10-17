import type { Progress } from './db'
import { nowIso } from './utils'

export const MAX_BOX = 5

// Qutidagi so'z necha kundan keyin yana chiqadi (indeks = quti raqami)
const INTERVAL_DAYS = [0, 0, 1, 3, 7, 14]

// 4- va 5-qutidagi so'zlar "yodlangan" hisoblanadi
export const LEARNED_BOX = 4

export function isDue(progress: Progress | undefined, now = Date.now()): boolean {
  return !progress || Date.parse(progress.nextReviewAt) <= now
}

export function nextProgress(wordId: string, prev: Progress | undefined, correct: boolean): Progress {
  const box = correct ? Math.min((prev?.box ?? 1) + 1, MAX_BOX) : 1
  const next = new Date()
  next.setDate(next.getDate() + INTERVAL_DAYS[box])

  return {
    wordId,
    box,
    nextReviewAt: next.toISOString(),
    correctCount: (prev?.correctCount ?? 0) + (correct ? 1 : 0),
    wrongCount: (prev?.wrongCount ?? 0) + (correct ? 0 : 1),
    updatedAt: nowIso(),
    dirty: 1,
  }
}
