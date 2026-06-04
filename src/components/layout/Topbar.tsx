import styles from './Topbar.module.css'

export function Topbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.logo}>S</div>
        <div className={styles.search}>
          <span>🔍</span>
          <span className={styles.placeholder}>Search flashcards</span>
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.create}>+</button>
        <button className={styles.cta}>Subscribe — 7 days free</button>
        <div className={styles.avatar}>U</div>
      </div>
    </header>
  )
}
