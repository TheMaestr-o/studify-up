import { useState, useCallback } from 'react'
import { fetchAnalytics, fetchWordDetail, type AnalyticsData, type WordDetailData } from '../api/client'

export function useAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [wordDetail, setWordDetail] = useState<WordDetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAnalytics = useCallback(async (setId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAnalytics(setId)
      setAnalyticsData(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch analytics'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [])

  const getWordDetail = useCallback(async (wordId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWordDetail(wordId)
      setWordDetail(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch word detail'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    analyticsData,
    wordDetail,
    loading,
    error,
    getAnalytics,
    getWordDetail,
  }
}
