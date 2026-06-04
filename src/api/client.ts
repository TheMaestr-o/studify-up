import type { Word, VocabSet, WordProgress, ReviewPayload, TelegramAuthData } from '../types'

const BASE = (import.meta as any).env?.VITE_API_URL ?? 'https://english-bot.ohnedan.workers.dev'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, init)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export const fetchSets = (studentId: number) =>
  apiFetch<VocabSet[]>(`/vocab-sets?student_id=${studentId}`)

export const fetchWords = (setId: string) =>
  apiFetch<Word[]>(`/vocab-words?set_id=${encodeURIComponent(setId)}`)

export const fetchSetMeta = (setId: string) =>
  apiFetch<{ name: string; word_count: number; language: string | null }>(
    `/set/${encodeURIComponent(setId)}/meta`
  )

export const authTelegram = (data: TelegramAuthData) =>
  apiFetch<{ userId: number }>('/auth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const fetchProgress = (userId: number, setId: string) =>
  apiFetch<WordProgress[]>(`/user/${userId}/progress?set_id=${encodeURIComponent(setId)}`)

export const saveReview = (userId: number, review: ReviewPayload) =>
  apiFetch<void>(`/user/${userId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  })
