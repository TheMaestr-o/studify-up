import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { WordStatsItem } from '../../api/client'
import styles from './WordDifficultyTable.module.css'

interface WordDifficultyTableProps {
  words: WordStatsItem[]
  onWordClick: (wordId: string) => void
  loading?: boolean
}

type SortField = 'word_en' | 'mastery_pct' | 'attempt_count' | 'error_count' | 'avg_days'
type SortOrder = 'asc' | 'desc'

export function WordDifficultyTable({ words, onWordClick, loading = false }: WordDifficultyTableProps) {
  const [sortField, setSortField] = useState<SortField>('mastery_pct')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedWords = [...words].sort((a, b) => {
    let aVal: number | string = 0
    let bVal: number | string = 0

    switch (sortField) {
      case 'word_en':
        aVal = a.word_en.toLowerCase()
        bVal = b.word_en.toLowerCase()
        break
      case 'mastery_pct':
        aVal = a.mastery_pct || 0
        bVal = b.mastery_pct || 0
        break
      case 'attempt_count':
        aVal = a.attempt_count
        bVal = b.attempt_count
        break
      case 'error_count':
        aVal = a.error_count
        bVal = b.error_count
        break
      case 'avg_days':
        aVal = a.avg_days || 0
        bVal = b.avg_days || 0
        break
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal)
    }

    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  const getMasteryColor = (pct: number): string => {
    if (pct >= 80) return styles.masteryGreen
    if (pct >= 50) return styles.masteryYellow
    return styles.masteryRed
  }

  const getMasteryEmoji = (pct: number): string => {
    if (pct >= 80) return '🟢'
    if (pct >= 50) return '🟡'
    return '🔴'
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
  }

  if (loading) {
    return <div className={styles.loading}>Loading words...</div>
  }

  if (words.length === 0) {
    return <div className={styles.empty}>No words assigned yet</div>
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th onClick={() => handleSort('word_en')} className={styles.sortable}>
              English Word
              <SortIcon field="word_en" />
            </th>
            <th>Ukrainian</th>
            <th onClick={() => handleSort('mastery_pct')} className={styles.sortable}>
              Mastery %
              <SortIcon field="mastery_pct" />
            </th>
            <th onClick={() => handleSort('attempt_count')} className={styles.sortable}>
              Attempts
              <SortIcon field="attempt_count" />
            </th>
            <th onClick={() => handleSort('error_count')} className={styles.sortable}>
              Errors
              <SortIcon field="error_count" />
            </th>
            <th onClick={() => handleSort('avg_days')} className={styles.sortable}>
              Avg Days
              <SortIcon field="avg_days" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedWords.map(word => (
            <tr key={word.id} className={styles.row}>
              <td className={styles.wordEn}>
                <button
                  className={styles.wordLink}
                  onClick={() => {
                    setExpandedWordId(expandedWordId === word.id ? null : word.id)
                    if (expandedWordId !== word.id) {
                      onWordClick(word.id)
                    }
                  }}
                >
                  {word.word_en}
                </button>
              </td>
              <td className={styles.wordUk}>{word.word_uk || '—'}</td>
              <td className={getMasteryColor(word.mastery_pct || 0)}>
                <span className={styles.masteryBadge}>
                  {getMasteryEmoji(word.mastery_pct || 0)} {(word.mastery_pct || 0).toFixed(1)}%
                </span>
              </td>
              <td className={styles.attempts}>{word.attempt_count}</td>
              <td className={styles.errors}>{word.error_count}</td>
              <td className={styles.avgDays}>{(word.avg_days || 0).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
