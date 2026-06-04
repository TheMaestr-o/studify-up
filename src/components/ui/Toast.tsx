import { useEffect, useState } from 'react'
import styles from './Toast.module.css'

interface ToastProps {
  message: string
  visible: boolean
}

export function Toast({ message, visible }: ToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
    } else {
      const t = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(t)
    }
  }, [visible])

  if (!show) return null

  return (
    <div className={`${styles.toast} ${visible ? styles.in : styles.out}`}>
      {message}
    </div>
  )
}
