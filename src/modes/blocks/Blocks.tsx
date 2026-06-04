import { useParams, useNavigate } from 'react-router-dom'
import { useWords } from '../../hooks/useWords'
import styles from './Blocks.module.css'

export function Blocks() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { words } = useWords(setId ?? null)
  return (
    <div className={styles.page}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        ← Back to set
      </button>
      <div className={styles.icon}>⊞</div>
      <h2>Play Blocks</h2>
      <p>Earn blocks by answering correctly. Fill the grid and complete lines to score!</p>
      <button className={styles.btn}>Play ({words.length} words)</button>
      <button className={styles.opts}>⚙ Options</button>
    </div>
  )
}
