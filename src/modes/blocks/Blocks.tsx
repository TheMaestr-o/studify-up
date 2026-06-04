import { useParams } from 'react-router-dom'
import { useWords } from '../../hooks/useWords'
import styles from './Blocks.module.css'

export function Blocks() {
  const { setId } = useParams<{ setId: string }>()
  const { words } = useWords(setId ?? null)
  return (
    <div className={styles.page}>
      <div className={styles.icon}>⊞</div>
      <h2>Play Blocks</h2>
      <p>Earn blocks by answering correctly. Fill the grid and complete lines to score!</p>
      <button className={styles.btn}>Play ({words.length} words)</button>
      <button className={styles.opts}>⚙ Options</button>
    </div>
  )
}
