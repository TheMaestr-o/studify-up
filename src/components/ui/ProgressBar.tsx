import styles from './ProgressBar.module.css'

interface Props {
  mastered: number
  familiar: number
  total: number
}

export function ProgressBar({ mastered, familiar, total }: Props) {
  if (total === 0) return null
  return (
    <div className={styles.track}>
      <div className={styles.mastered} style={{ width: `${(mastered / total) * 100}%` }} />
      <div className={styles.familiar} style={{ width: `${(familiar / total) * 100}%` }} />
    </div>
  )
}
