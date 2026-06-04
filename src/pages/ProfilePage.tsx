import { useState } from 'react'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const googleUser = JSON.parse(localStorage.getItem('googleUser') ?? 'null') as {
    name?: string
    email?: string
    picture?: string
  } | null

  const [studentId, setStudentId] = useState(localStorage.getItem('userId') ?? '')
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(studentId)

  function handleSignOut() {
    localStorage.removeItem('userId')
    localStorage.removeItem('googleUser')
    window.location.href = '/login'
  }

  function handleEditSave() {
    const trimmed = editValue.trim()
    if (trimmed) {
      localStorage.setItem('userId', trimmed)
      setStudentId(trimmed)
    }
    setEditing(false)
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleEditSave()
    if (e.key === 'Escape') setEditing(false)
  }

  const fallbackLetter = googleUser?.name ? googleUser.name.charAt(0).toUpperCase() : 'U'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.avatarWrap}>
          {googleUser?.picture ? (
            <img
              src={googleUser.picture}
              alt={fallbackLetter}
              className={styles.avatar}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={styles.avatarFallback}>{fallbackLetter}</div>
          )}
        </div>
        <div className={styles.name}>{googleUser?.name ?? 'Unknown user'}</div>
        <div className={styles.email}>{googleUser?.email ?? ''}</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Student ID</div>
        <div className={styles.row}>
          {editing ? (
            <>
              <input
                className={styles.idInput}
                value={editValue}
                autoFocus
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
              />
              <button className={styles.saveBtn} onClick={handleEditSave}>Save</button>
              <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <span className={styles.idValue}>{studentId || '—'}</span>
              <button className={styles.editBtn} onClick={() => { setEditValue(studentId); setEditing(true) }}>
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <button className={styles.signOutBtn} onClick={handleSignOut}>Sign out</button>
      </div>

      <div className={styles.version}>Studify Up v1.0</div>
    </div>
  )
}
