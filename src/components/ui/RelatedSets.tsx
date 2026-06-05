import { useNavigate } from 'react-router-dom'
import styles from './RelatedSets.module.css'

interface RelatedSet {
  id: string
  name: string
  termCount: number
  creator?: string
}

interface RelatedSetsProps {
  sets?: RelatedSet[]
}

export function RelatedSets({ sets = [] }: RelatedSetsProps) {
  const navigate = useNavigate()

  // Show placeholder if no sets provided
  if (!sets || sets.length === 0) {
    return (
      <div className={styles.section}>
        <h2 className={styles.title}>Related sets</h2>
        <p className={styles.placeholder}>No related sets yet</p>
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>Related sets</h2>
      <div className={styles.grid}>
        {sets.map(set => (
          <div
            key={set.id}
            className={styles.setCard}
            onClick={() => navigate(`/set/${set.id}`)}
          >
            <p className={styles.setName}>{set.name}</p>
            <p className={styles.setMeta}>{set.termCount} terms</p>
            {set.creator && <p className={styles.creator}>by {set.creator}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
