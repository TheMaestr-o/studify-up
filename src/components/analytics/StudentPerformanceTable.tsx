import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { StudentStatsItem } from '../../api/client'
import styles from './StudentPerformanceTable.module.css'

interface StudentPerformanceTableProps {
  students: StudentStatsItem[]
  loading?: boolean
}

type SortField = 'name' | 'total_reviews' | 'correct' | 'accuracy_pct'
type SortOrder = 'asc' | 'desc'

function SortIcon({ field, sortField, sortOrder }: { field: SortField; sortField: SortField; sortOrder: SortOrder }) {
  if (sortField !== field) return null
  return sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
}

export function StudentPerformanceTable({ students, loading = false }: StudentPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('accuracy_pct')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    }
  }

  const sortedStudents = [...students].sort((a, b) => {
    let aVal: number | string = 0
    let bVal: number | string = 0

    switch (sortField) {
      case 'name':
        aVal = (a.first_name || '').toLowerCase()
        bVal = (b.first_name || '').toLowerCase()
        if (aVal === bVal && a.username && b.username) {
          aVal = a.username.toLowerCase()
          bVal = b.username.toLowerCase()
        }
        break
      case 'total_reviews':
        aVal = a.total_reviews
        bVal = b.total_reviews
        break
      case 'correct':
        aVal = a.correct
        bVal = b.correct
        break
      case 'accuracy_pct':
        aVal = a.accuracy_pct || 0
        bVal = b.accuracy_pct || 0
        break
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal)
    }

    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  const getAccuracyColor = (pct: number): string => {
    if (pct >= 80) return styles.accuracyGreen
    if (pct >= 60) return styles.accuracyYellow
    return styles.accuracyRed
  }

  if (loading) {
    return <div className={styles.loading}>Loading student data...</div>
  }

  if (students.length === 0) {
    return <div className={styles.empty}>No student data available</div>
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} className={styles.sortable}>
              Student Name
              <SortIcon field="name" sortField={sortField} sortOrder={sortOrder} />
            </th>
            <th onClick={() => handleSort('total_reviews')} className={styles.sortable}>
              Total Reviews
              <SortIcon field="total_reviews" sortField={sortField} sortOrder={sortOrder} />
            </th>
            <th onClick={() => handleSort('correct')} className={styles.sortable}>
              Correct
              <SortIcon field="correct" sortField={sortField} sortOrder={sortOrder} />
            </th>
            <th onClick={() => handleSort('accuracy_pct')} className={styles.sortable}>
              Accuracy %
              <SortIcon field="accuracy_pct" sortField={sortField} sortOrder={sortOrder} />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents.map((student, index) => (
            <tr key={student.student_id} className={styles.row}>
              <td className={styles.name}>
                <span className={styles.rank}>{index + 1}.</span>
                <span>{student.first_name}</span>
                {student.username && <span className={styles.username}>@{student.username}</span>}
              </td>
              <td className={styles.totalReviews}>{student.total_reviews}</td>
              <td className={styles.correct}>
                {student.correct}/{student.total_reviews}
              </td>
              <td className={getAccuracyColor(student.accuracy_pct || 0)}>
                <span className={styles.accuracyBadge}>
                  {(student.accuracy_pct || 0).toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
