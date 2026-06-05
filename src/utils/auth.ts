export interface StoredUser {
  name: string
  email: string
  picture: string
}

/** Valid Telegram student id stored after linking (not guest / skip). */
export function getLinkedStudentId(): number | null {
  const raw = localStorage.getItem('userId')
  if (!raw) return null
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

export function getGoogleUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('googleUser')
    if (!raw) return null
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function getGoogleToken(): string | null {
  return localStorage.getItem('googleToken')
}

export function isLinkedAccount(): boolean {
  return getLinkedStudentId() !== null && getGoogleUser() !== null && getGoogleToken() !== null
}

export function finishLogin(user: StoredUser, studentId: number | string, token?: string) {
  const id = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId
  if (!Number.isInteger(id) || id <= 0) return false
  localStorage.setItem('googleUser', JSON.stringify(user))
  localStorage.setItem('userId', String(id))
  if (token) localStorage.setItem('googleToken', token)
  return true
}

export function clearSession() {
  localStorage.removeItem('userId')
  localStorage.removeItem('googleUser')
  localStorage.removeItem('googleToken')
}

/** Drop invalid sessions from older builds (e.g. userId "0" after Skip). */
export function migrateLegacySession() {
  const raw = localStorage.getItem('userId')
  if (!raw) return
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) {
    localStorage.removeItem('userId')
  }
}
