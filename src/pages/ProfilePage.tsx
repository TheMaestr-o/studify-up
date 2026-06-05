import { useState } from 'react'
import {
  clearSession,
  finishLogin,
  getGoogleUser,
  getLinkedStudentId,
} from '../utils/auth'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const googleUser = getGoogleUser()
  const linkedId = getLinkedStudentId()

  const [studentId, setStudentId] = useState(linkedId ? String(linkedId) : '')
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(studentId)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleSignOut() {
    clearSession()
    window.location.href = '/login'
  }

  function handleEditSave() {
    const trimmed = editValue.trim()
    if (!trimmed || !/^\d+$/.test(trimmed) || Number(trimmed) <= 0) {
      setSaveError('Enter a valid numeric Student ID from your teacher.')
      return
    }
    const user = googleUser ?? { name: 'Student', email: '', picture: '' }
    if (!finishLogin(user, trimmed)) {
      setSaveError('Could not save Student ID.')
      return
    }
    setSaveError(null)
    setStudentId(trimmed)
    setEditing(false)
    window.location.href = '/'
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleEditSave()
    if (e.key === 'Escape') { setEditing(false); setSaveError(null) }
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
        <p className={styles.sectionHint}>Must match your Telegram account (ask your teacher).</p>
        <div className={styles.row}>
          {editing ? (
            <>
              <input
                className={styles.idInput}
                value={editValue}
                inputMode="numeric"
                autoFocus
                onChange={e => { setEditValue(e.target.value.replace(/\D/g, '')); setSaveError(null) }}
                onKeyDown={handleEditKeyDown}
              />
              <button className={styles.saveBtn} onClick={handleEditSave}>Save</button>
              <button className={styles.cancelBtn} onClick={() => { setEditing(false); setSaveError(null) }}>Cancel</button>
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
        {saveError && <p className={styles.saveError}>{saveError}</p>}
      </div>

      <div className={styles.section}>
        <button className={styles.signOutBtn} onClick={handleSignOut}>Sign out</button>
      </div>

      <div className={styles.version}>Studify Up v1.0</div>
    </div>
  )
}
