import type { Word, VocabSet, WordProgress, ReviewPayload, TelegramAuthData } from '../types'
import { getGoogleToken } from '../utils/auth'

const BASE = import.meta.env.VITE_API_URL ?? 'https://english-bot.ohnedan.workers.dev'

function getAuthHeaders(): HeadersInit {
  const token = getGoogleToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = getAuthHeaders()
  const res = await fetch(BASE + path, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  })
  const data = await res.json() as Record<string, unknown> & { error?: string }

  if (!res.ok) {
    const errorMsg = data?.error || `API ${res.status}`
    throw new Error(errorMsg)
  }

  return data as T
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
  apiFetch<{ success: boolean; nextReviewDate: string; masteryLevel: string; stats: { correct_count: number; attempt_count: number; accuracy: string } }>(
    '/api/progress',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        set_id: review.setId,
        word_id: review.wordId,
        student_id: userId,
        correct: review.correct,
        responseTimeMs: review.responseTimeMs,
      }),
    }
  )

export const submitImport = (
  setName: string,
  language: string,
  words: Array<{ word_en: string; word_uk: string }>
) =>
  apiFetch<{ setId: string; importedCount: number; skippedCount: number }>(
    '/import',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        set_name: setName,
        language,
        words,
      }),
    }
  )
