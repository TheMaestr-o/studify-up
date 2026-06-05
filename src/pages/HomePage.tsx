import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Layers, ArrowRight, Brain, Volume2, Smartphone, Zap } from 'lucide-react'
import { useSets } from '../hooks/useSets'
import { Skeleton } from '../components/ui/Skeleton'
import { STARTER_PACK_ID, STARTER_PACK_NAME, STARTER_WORDS } from '../data/starterPack'
import { getLinkedStudentId, isLinkedAccount } from '../utils/auth'
import styles from './HomePage.module.css'

const DEMO_PAIRS = [
  { en: 'abandon',   uk: 'покинути' },
  { en: 'achieve',   uk: 'досягти' },
  { en: 'brilliant', uk: 'блискучий' },
  { en: 'curious',   uk: 'допитливий' },
  { en: 'evidence',  uk: 'докази' },
]

const FEATURES = [
  { Icon: Layers,     text: '6 study modes' },
  { Icon: Volume2,    text: 'Audio on every card' },
  { Icon: Brain,      text: 'Spaced repetition' },
  { Icon: Smartphone, text: 'Sync with Telegram' },
]

function DemoCard() {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    let step = 0
    const timer = setInterval(() => {
      step++
      if (step % 2 === 1) {
        setFlipped(true)
      } else {
        setFlipped(false)
        setTimeout(() => setIdx(i => (i + 1) % DEMO_PAIRS.length), 400)
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  const pair = DEMO_PAIRS[idx]

  return (
    <div className={styles.demoWrap}>
      <div className={styles.demoGlow} />
      <div className={`${styles.demoCard} ${flipped ? styles.flipped : ''}`}>
        <div className={styles.demoFront}>
          <span className={styles.demoLang}>EN</span>
          <span className={styles.demoWord}>{pair.en}</span>
        </div>
        <div className={styles.demoBack}>
          <span className={styles.demoLang}>UA</span>
          <span className={styles.demoWord}>{pair.uk}</span>
        </div>
      </div>
      <p className={styles.demoHint}>Tap to flip · Studify Up</p>
    </div>
  )
}

function LandingPage() {
  return (
    <div className={styles.landing}>
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.badge}>Free Quizlet alternative</div>
          <h1 className={styles.heroTitle}>
            Study smarter.<br />Remember forever.
          </h1>
          <p className={styles.heroSub}>
            Everything Quizlet charges for — completely free.<br />
            Share a set link and your students can start instantly.
          </p>

          <div className={styles.featureGrid}>
            {FEATURES.map(({ Icon, text }) => (
              <div key={text} className={styles.featureItem}>
                <Icon size={16} strokeWidth={1.8} />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className={styles.ctaRow}>
            <a href="/login" className={styles.ctaPrimary}>
              Get started free <ArrowRight size={16} strokeWidth={2} />
            </a>
            <a href={`/set/${STARTER_PACK_ID}`} className={styles.ctaSecondary}>
              Try Starter Pack
            </a>
          </div>
        </div>

        <div className={styles.heroRight}>
          <DemoCard />
        </div>
      </div>

      <div className={styles.starterBanner}>
        <div className={styles.starterBannerInner}>
          <div className={styles.starterBannerIcon}>
            <Zap size={20} strokeWidth={1.8} color="#fff" />
          </div>
          <div>
            <div className={styles.starterBannerTitle}>Got a link to a vocabulary set?</div>
            <div className={styles.starterBannerSub}>Just open it — no account needed to start learning</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StarterPackCard() {
  return (
    <a href={`/set/${STARTER_PACK_ID}`} className={styles.starterCard}>
      <div className={styles.starterIcon}><Layers size={22} strokeWidth={1.8} color="#fff" /></div>
      <div className={styles.starterInfo}>
        <div className={styles.starterName}>{STARTER_PACK_NAME}</div>
        <div className={styles.starterMeta}>{STARTER_WORDS.length} essential words · Free for everyone</div>
      </div>
      <ArrowRight size={18} color="rgba(255,255,255,0.4)" />
    </a>
  )
}

export function HomePage() {
  const linked = isLinkedAccount()
  const studentId = getLinkedStudentId()
  const { sets, loading, error } = useSets(studentId)

  if (!linked) return <LandingPage />

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Sets</h1>
        </div>
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="100px" borderRadius="10px" />
          ))}
        </div>
      </div>
    )
  }

  if (sets.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Sets</h1>
        </div>

        <div className={styles.emptyBlock}>
          <BookOpen size={44} strokeWidth={1.2} color="rgba(255,255,255,0.15)" />
          <h2 className={styles.emptyTitle}>
            {error ? 'Could not load your sets' : 'No teacher sets yet'}
          </h2>
          <p className={styles.emptyText}>
            {error
              ? 'Check your connection and try again.'
              : 'Your teacher may not have assigned words yet — or your Student ID might be wrong.'}
          </p>
          <a href={`/set/${STARTER_PACK_ID}`} className={styles.emptyCta}>
            Open Starter Pack <ArrowRight size={16} strokeWidth={2} />
          </a>
          <p className={styles.emptyHint}>
            Linked as ID <strong>{studentId}</strong>. Wrong number?{' '}
            <Link to="/profile">Fix in Profile</Link>
          </p>
        </div>

        <div className={styles.starterSection}>
          <p className={styles.starterLabel}>Free practice</p>
          <StarterPackCard />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Sets</h1>
      </div>

      <div className={styles.grid}>
        <a href={`/set/${STARTER_PACK_ID}`} className={`${styles.card} ${styles.cardStarter}`}>
          <div className={styles.starterBadge}>Free for all</div>
          <div className={styles.name}>{STARTER_PACK_NAME}</div>
          <div className={styles.meta}>{STARTER_WORDS.length} terms</div>
          <div className={styles.lang}>EN</div>
        </a>

        {sets.map(set => (
          <a key={set.id} href={`/set/${set.id}`} className={styles.card}>
            <div className={styles.name}>{set.name}</div>
            {set.word_count !== undefined && (
              <div className={styles.meta}>{set.word_count} terms</div>
            )}
            {set.language && (
              <div className={styles.lang}>{set.language.toUpperCase()}</div>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
