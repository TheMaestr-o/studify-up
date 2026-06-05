import { Users } from 'lucide-react'
import styles from './CreatorCard.module.css'

interface CreatorCardProps {
  name: string
  badge?: string
  avatar?: string
  onClick?: () => void
}

export function CreatorCard({ name, badge = 'Teacher', avatar, onClick }: CreatorCardProps) {
  return (
    <div className={styles.card} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className={styles.content}>
        <div className={styles.avatar}>
          {avatar ? (
            <img src={avatar} alt={name} />
          ) : (
            <Users size={18} strokeWidth={2} />
          )}
        </div>
        <div className={styles.info}>
          <p className={styles.name}>{name}</p>
          <p className={styles.badge}>{badge}</p>
        </div>
      </div>
    </div>
  )
}
