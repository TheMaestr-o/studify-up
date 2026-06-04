import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import styles from './LoginPage.module.css'

function decodeJwt(token: string) {
  const payload = token.split('.')[1]!
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
}

interface GoogleUser {
  name: string
  email: string
  picture: string
}

export function LoginPage() {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null)
  const [studentId, setStudentId] = useState('')

  function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    const credential = credentialResponse.credential
    if (!credential) return
    const payload = decodeJwt(credential)
    const user: GoogleUser = {
      name: payload.name ?? '',
      email: payload.email ?? '',
      picture: payload.picture ?? '',
    }
    setGoogleUser(user)
  }

  function handleLink(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = studentId.trim()
    if (!trimmed) return
    localStorage.setItem('googleUser', JSON.stringify(googleUser))
    localStorage.setItem('userId', trimmed)
    window.location.reload()
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logo}>S</div>
        <h1 className={styles.title}>Studify Up</h1>
        <p className={styles.subtitle}>Study smarter. Remember forever.</p>

        <div className={styles.divider} />

        {!googleUser ? (
          <div className={styles.googleWrap}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error('Google login failed')}
              theme="filled_blue"
              shape="pill"
              size="large"
              width="320"
            />
          </div>
        ) : (
          <form className={styles.step2} onSubmit={handleLink}>
            <p className={styles.step2Title}>One more step</p>
            <p className={styles.hint}>Your teacher will give you this ID</p>
            <input
              className={styles.input}
              type="text"
              placeholder="Enter your Student ID"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              autoFocus
            />
            <button className={styles.linkButton} type="submit">
              Link account
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
