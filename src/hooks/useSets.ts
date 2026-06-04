import { useState, useEffect } from 'react'
import { fetchSets } from '../api/client'
import type { VocabSet } from '../types'

export function useSets(userId: number | null) {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetchSets(userId)
      .then(setSets)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [userId])

  return { sets, loading, error }
}
