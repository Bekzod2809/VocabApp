import { Capacitor } from '@capacitor/core'
import { getMeta } from './db'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Serverga ulanib bo'lmadi. Internet va server manzilini tekshiring.")
  }
}

const REQUEST_TIMEOUT_MS = 20_000

// Saytda: sayt ochilgan kompyuterning 5080-porti.
// Ilovada (APK): build paytida berilgan manzil (VITE_DEFAULT_SERVER), keyin sozlamada o'zgartirsa bo'ladi.
export function defaultServerUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return import.meta.env.VITE_DEFAULT_SERVER ?? ''
  }
  return `${location.protocol}//${location.hostname}:5080`
}

export async function getServerUrl(): Promise<string> {
  return (await getMeta<string>('serverUrl')) ?? defaultServerUrl()
}

export function normalizeServerUrl(url: string): string {
  let result = url.trim().replace(/\/+$/, '')
  if (result && !/^https?:\/\//i.test(result)) {
    result = `http://${result}`
  }
  return result
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string
}

export async function apiRequest<T>(serverUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  let response: Response
  try {
    response = await fetch(`${serverUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    })
  } catch {
    throw new NetworkError()
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }

  return (await response.json()) as T
}

async function readErrorMessage(response: Response): Promise<string> {
  if (response.status === 429) {
    return "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring."
  }

  try {
    const body = await response.json()
    // ValidationException: { detail: { Field: ["xato"] } }
    if (body?.detail && typeof body.detail === 'object') {
      const first = Object.values(body.detail as Record<string, string[]>)[0]
      if (Array.isArray(first) && first[0]) return first[0]
    }
    if (body?.errors && typeof body.errors === 'object') {
      const first = Object.values(body.errors as Record<string, string[]>)[0]
      if (Array.isArray(first) && first[0]) return first[0]
    }
    return body?.message ?? body?.title ?? `Server xatosi (${response.status})`
  } catch {
    return `Server xatosi (${response.status})`
  }
}
