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

export interface WordStatsItem {
  id: string
  word_en: string
  word_uk: string | null
  attempt_count: number
  error_count: number
  mastery_pct: number
  avg_days: number
}

export interface StudentStatsItem {
  student_id: number
  username: string | null
  first_name: string
  total_reviews: number
  correct: number
  accuracy_pct: number
}

export interface OverallStatsData {
  total_students: number
  avg_mastery_pct: number
  avg_attempts: number
}

export interface AnalyticsData {
  word_stats: WordStatsItem[]
  student_stats: StudentStatsItem[]
  overall_stats: OverallStatsData
}

export interface WordDetailData {
  struggling_students: Array<{
    student_id: number
    username: string | null
    first_name: string
    attempts: number
    correct: number
    accuracy_pct: number
  }>
}

export const fetchAnalytics = (setId: string) =>
  apiFetch<AnalyticsData>(`/analytics/set/${encodeURIComponent(setId)}`)

export const fetchWordDetail = (wordId: string) =>
  apiFetch<WordDetailData>(`/analytics/word/${encodeURIComponent(wordId)}`)

export const exportAnalytics = (setId: string) =>
  fetch(`${BASE}/analytics/export/${encodeURIComponent(setId)}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })

export interface DashboardStats {
  total: number
  mastered: number
  reviewing: number
  new: number
}

export interface RetentionDataPoint {
  day: string
  retention_pct: number
}

export interface NextReview {
  id: string
  word_en: string
  word_uk: string | null
  next_review_date: string
  status: 'due_now' | 'due_tomorrow' | 'due_later'
}

export interface MasteryDataPoint {
  start_day: string
  newly_mastered: number
  total_reviewed: number
  cumulative_mastered: number
}

export interface HeatmapDay {
  date: string
  count: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export const fetchDashboardStats = (studentId: number) =>
  apiFetch<DashboardStats>(`/dashboard/stats/${studentId}`)

export const fetchDashboardRetention = (studentId: number) =>
  apiFetch<RetentionDataPoint[]>(`/dashboard/retention/${studentId}`)

export const fetchDashboardNextReviews = (studentId: number, limit = 20) =>
  apiFetch<NextReview[]>(`/dashboard/next-reviews/${studentId}?limit=${limit}`)

export const fetchDashboardMasteryTimeline = (studentId: number) =>
  apiFetch<MasteryDataPoint[]>(`/dashboard/mastery-timeline/${studentId}`)

export const fetchDashboardHeatmap = (studentId: number) =>
  apiFetch<HeatmapDay[]>(`/dashboard/heatmap/${studentId}`)
