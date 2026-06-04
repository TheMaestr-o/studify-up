import { Lock } from 'lucide-react'
import styles from './ModeCard.module.css'

interface Props {
  icon: React.ReactNode
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
      {locked && <Lock size={12} className={styles.lock} />}
    </button>
  )
}
