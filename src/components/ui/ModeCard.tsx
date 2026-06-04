import styles from './ModeCard.module.css'

interface Props {
  icon: string
  label: string
  color: string
  onClick?: () => void
  locked?: boolean
}

export function ModeCard({ icon, label, color, onClick, locked }: Props) {
  return (
    <button className={styles.card} onClick={onClick} disabled={locked}>
      <div className={styles.icon} style={{ background: color }}>{icon}</div>
      <span className={styles.label}>{label}</span>
      {locked && <span className={styles.lock}>🔒</span>}
    </button>
  )
}
