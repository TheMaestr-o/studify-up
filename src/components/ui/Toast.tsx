import { useEffect, useState } from 'react'
import styles from './Toast.module.css'

/**
 * Toast notification component with optional action button
 * @param message - The message to display
 * @param visible - Whether the toast is visible
 * @param action - Optional action object with label and callback
 * @param duration - Auto-dismiss duration in ms (default: 3000)
 */
interface ToastProps {
  message: string
  visible: boolean
  action?: {
    label: string
    callback: () => void
  }
  duration?: number
}

export function Toast({ message, visible, action, duration = 3000 }: ToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timeout = setTimeout(() => setShow(false), duration)
      return () => clearTimeout(timeout)
    } else {
      const t = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(t)
    }
  }, [visible, duration])

  if (!show) return null

  const handleAction = () => {
    action?.callback()
    setShow(false)
  }

  return (
    <div className={`${styles.toast} ${visible ? styles.in : styles.out}`}>
      <div className={styles.content}>
        <span className={styles.message}>{message}</span>
        {action && (
          <button
            className={styles.actionBtn}
            onClick={handleAction}
            aria-label={action.label}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
