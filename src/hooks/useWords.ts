import { useState, useEffect } from 'react'
import { fetchWords } from '../api/client'
import type { Word } from '../types'

export function useWords(setId: string | null) {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!setId) return
    setLoading(true)
    setError(null)
    fetchWords(setId)
      .then(setWords)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [setId])

  return { words, loading, error }
}
