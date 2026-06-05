import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import type { NextReview } from '../../api/client'
import styles from './NextReviewTable.module.css'

interface NextReviewTableProps {
  reviews: NextReview[]
  onStudyWord?: (wordId: string) => void
}

export function NextReviewTable({ reviews, onStudyWord }: NextReviewTableProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className={styles.empty}>
        <CheckCircle size={40} />
        <p>No words due for review!</p>
        <p className={styles.hint}>Keep up your study streak</p>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'due_now':
        return <AlertCircle size={18} className={styles.iconDueNow} />
      case 'due_tomorrow':
        return <Clock size={18} className={styles.iconDueTomorrow} />
      default:
        return <Clock size={18} className={styles.iconDueLater} />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'due_now':
        return 'Due now'
      case 'due_tomorrow':
        return 'Due tomorrow'
      default:
        return 'Due soon'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Word</th>
            <th>Translation</th>
            <th>Due</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map(review => (
            <tr key={review.id} className={styles.row}>
              <td className={styles.wordCell}>
                <strong>{review.word_en}</strong>
              </td>
              <td className={styles.translationCell}>{review.word_uk || '—'}</td>
              <td className={styles.dueCell}>{formatDate(review.next_review_date)}</td>
              <td className={styles.statusCell}>
                <span className={`${styles.statusBadge} ${styles[`status_${review.status}`]}`}>
                  {getStatusIcon(review.status)}
                  <span>{getStatusLabel(review.status)}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
