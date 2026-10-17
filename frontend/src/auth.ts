import { apiRequest } from './api'
import { deleteMeta, getMeta, setMeta } from './db'
import { resetSyncState } from './sync'

interface LoginResponse {
  accessToken: string
  tokenType: string
  expires: number
}

interface SetupStatus {
  isSetupDone: boolean
}

export async function getToken(): Promise<string | undefined> {
  return getMeta<string>('token')
}

export async function fetchSetupStatus(serverUrl: string): Promise<boolean> {
  const status = await apiRequest<SetupStatus>(serverUrl, '/api/auth/setup-status')
  return status.isSetupDone
}

// isSetup = true: birinchi marta hisob yaratish, aks holda oddiy login
export async function signIn(serverUrl: string, userName: string, password: string, isSetup: boolean): Promise<void> {
  const response = await apiRequest<LoginResponse>(serverUrl, isSetup ? '/api/auth/setup' : '/api/auth/login', {
    method: 'POST',
    body: { userName: userName.trim(), password },
  })

  const previousServer = await getMeta<string>('serverUrl')
  if (previousServer && previousServer !== serverUrl) {
    // Boshqa serverga o'tildi: u yerda versiyalar boshqacha, boshidan sinx qilamiz
    await resetSyncState()
  }

  await setMeta('serverUrl', serverUrl)
  await setMeta('userName', userName.trim())
  await setMeta('token', response.accessToken)
}

export async function signOut(): Promise<void> {
  await deleteMeta('token')
}
