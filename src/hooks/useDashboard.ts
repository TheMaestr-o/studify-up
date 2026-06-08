import { useState, useEffect } from 'react'
import {
  fetchDashboardStats,
  fetchDashboardRetention,
  fetchDashboardNextReviews,
  fetchDashboardMasteryTimeline,
  fetchDashboardHeatmap,
} from '../api/client'
import type {
  DashboardStats,
  RetentionDataPoint,
  NextReview,
  MasteryDataPoint,
  HeatmapDay,
} from '../api/client'

export interface DashboardData {
  stats: DashboardStats | null
  retention: RetentionDataPoint[]
  nextReviews: NextReview[]
  masteryTimeline: MasteryDataPoint[]
  heatmap: HeatmapDay[]
  loading: boolean
  error: string | null
}

export function useDashboard(studentId: number | null): DashboardData {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [retention, setRetention] = useState<RetentionDataPoint[]>([])
  const [nextReviews, setNextReviews] = useState<NextReview[]>([])
  const [masteryTimeline, setMasteryTimeline] = useState<MasteryDataPoint[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) {
      setStats(null)
      setRetention([])
      setNextReviews([])
      setMasteryTimeline([])
      setHeatmap([])
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [statsData, retentionData, reviewsData, timelineData, heatmapData] = await Promise.all([
          fetchDashboardStats(studentId),
          fetchDashboardRetention(studentId),
          fetchDashboardNextReviews(studentId, 20),
          fetchDashboardMasteryTimeline(studentId),
          fetchDashboardHeatmap(studentId),
        ])

        setStats(statsData)
        setRetention(retentionData)
        setNextReviews(reviewsData)
        setMasteryTimeline(timelineData)
        setHeatmap(heatmapData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [studentId])

  return { stats, retention, nextReviews, masteryTimeline, heatmap, loading, error }
}
