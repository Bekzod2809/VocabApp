export const nowIso = () => new Date().toISOString()

export const toTime = (iso: string) => Date.parse(iso)

// Serverdan kelgan sanani bir xil formatga keltiradi (mikrosekundlarni kesadi)
export const normalizeIso = (iso: string) => new Date(iso).toISOString()

// crypto.randomUUID faqat HTTPS/localhost'da ishlaydi, LAN'dagi http'da yo'q
export function uuid(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function timeAgo(iso: string | undefined): string {
  if (!iso) return 'hali sinx qilinmagan'

  const minutes = Math.floor((Date.now() - toTime(iso)) / 60_000)
  if (minutes < 1) return 'hozirgina'
  if (minutes < 60) return `${minutes} daqiqa oldin`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} soat oldin`

  return `${Math.floor(hours / 24)} kun oldin`
}
