import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { Layers, Brain, Volume2, Smartphone, GraduationCap, Infinity } from 'lucide-react'
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

const FEATURES = [
  { Icon: Layers,       text: '6 study modes — Flashcards, Match, Learn, Test, Blocks, Blast' },
  { Icon: Brain,        text: 'Spaced repetition (FSRS) — remember words long-term' },
  { Icon: Volume2,      text: 'Audio pronunciation on every card' },
  { Icon: Smartphone,   text: 'Study on web or Telegram — progress syncs automatically' },
  { Icon: GraduationCap,text: 'Teacher assigns words directly to your account' },
  { Icon: Infinity,     text: 'Everything free — no paywalls, no limits' },
]

export function LoginPage() {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null)
  const [studentId, setStudentId] = useState('')

  function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    const credential = credentialResponse.credential
    if (!credential) return
    const payload = decodeJwt(credential)
    setGoogleUser({ name: payload.name ?? '', email: payload.email ?? '', picture: payload.picture ?? '' })
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
      <div className={styles.inner}>

        {/* LEFT: Hero */}
        <div className={styles.hero}>
          <div className={styles.badge}>Free Quizlet alternative</div>
          <h1 className={styles.heroTitle}>
            Study smarter.<br />Remember forever.
          </h1>
          <p className={styles.heroSub}>
            Everything Quizlet charges for — completely free.<br />
            Used by students and teachers worldwide.
          </p>
          <ul className={styles.features}>
            {FEATURES.map(({ Icon, text }) => (
              <li key={text} className={styles.feature}>
                <span className={styles.featureIcon}><Icon size={17} strokeWidth={1.8} /></span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT: Sign-in card */}
        <div className={styles.card}>
          <div className={styles.logo}>S</div>
          <h2 className={styles.cardTitle}>Studify Up</h2>
          <p className={styles.cardSub}>Study smarter. Remember forever.</p>

          <div className={styles.divider} />

          {!googleUser ? (
            <div className={styles.googleWrap}>
              <p className={styles.signInLabel}>Sign in to get started</p>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.error('Google login failed')}
                theme="filled_blue"
                shape="pill"
                size="large"
                width="280"
              />
              <p className={styles.hint}>Free forever · No credit card needed</p>
            </div>
          ) : (
            <form className={styles.step2} onSubmit={handleLink}>
              <div className={styles.userRow}>
                {googleUser.picture && (
                  <img src={googleUser.picture} className={styles.userPic} alt="" referrerPolicy="no-referrer" />
                )}
                <div>
                  <div className={styles.userName}>{googleUser.name}</div>
                  <div className={styles.userEmail}>{googleUser.email}</div>
                </div>
              </div>
              <p className={styles.step2Title}>Enter your Student ID</p>
              <p className={styles.hint}>Your teacher will send you this number</p>
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                placeholder="e.g. 123456789"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                autoFocus
              />
              <button className={styles.linkButton} type="submit">Start studying →</button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
