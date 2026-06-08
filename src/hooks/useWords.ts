import { useState, useEffect } from 'react'
import { fetchWords } from '../api/client'
import { STARTER_PACK_ID, STARTER_WORDS } from '../data/starterPack'
import { DOPAMINE_AIRPORT_ID, DOPAMINE_AIRPORT_WORDS } from '../data/dopamineAirport'
import type { Word } from '../types'

export function useWords(setId: string | null) {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!setId) return
    if (setId === STARTER_PACK_ID) {
      setWords(STARTER_WORDS)
      return
    }
    if (setId === DOPAMINE_AIRPORT_ID) {
      setWords(DOPAMINE_AIRPORT_WORDS)
      return
    }
    setLoading(true)
    setError(null)
    fetchWords(setId)
      .then(setWords)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [setId])

  return { words, loading, error }
}
