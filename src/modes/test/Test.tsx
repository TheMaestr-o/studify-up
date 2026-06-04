import { useParams } from 'react-router-dom'
import styles from './Test.module.css'

export function Test() {
  useParams()
  return (
    <div className={styles.page}>
      <div className={styles.lock}>📝</div>
      <h2>Test Mode</h2>
      <p>Unlock unlimited practice tests with Studify Plus.</p>
      <button className={styles.cta}>Start 7-day free trial</button>
    </div>
  )
}
