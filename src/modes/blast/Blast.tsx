import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWords } from '../../hooks/useWords'
import styles from './Blast.module.css'

const SKINS = ['🚀', '🛸', '🛩️', '✈️']

export function Blast() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { words } = useWords(setId ?? null)
  const [skin, setSkin] = useState(0)
  return (
    <div className={styles.page}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        ← Back to set
      </button>
      <div className={styles.skinRow}>
        <button className={styles.arrow} onClick={() => setSkin(s => (s - 1 + SKINS.length) % SKINS.length)}>‹</button>
        <div className={styles.ship}>{SKINS[skin]}</div>
        <button className={styles.arrow} onClick={() => setSkin(s => (s + 1) % SKINS.length)}>›</button>
      </div>
      <h2>Play Blast!</h2>
      <p>Match definitions to the correct terms. Click the right asteroid before time runs out!</p>
      <button className={styles.btn}>Play ({words.length} words)</button>
      <button className={styles.rules}>? Game rules</button>
    </div>
  )
}
