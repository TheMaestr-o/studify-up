import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Layers, ArrowRight, Brain, Volume2, Smartphone, Zap, Play } from 'lucide-react'
import { useSets } from '../hooks/useSets'
import { fetchProgress } from '../api/client'
import { Skeleton } from '../components/ui/Skeleton'
import { CustomCursor, ParticleBackground, InteractiveTilt } from '../components/landing'
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
        setTimeout(() => setIdx(i => (i + 1) % DEMO_PAIRS.length), 700)
      }
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  const pair = DEMO_PAIRS[idx]

  return (
    <div className={styles.demoWrap}>
      <div className={styles.demoGlow} />
      <InteractiveTilt scale={1.08} speed={400}>
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
      </InteractiveTilt>
      <p className={styles.demoHint}>Hover to tilt · Tap to flip · Studify Up</p>
    </div>
  )
}

function LandingPage() {
  return (
    <div className={styles.landing}>
      <CustomCursor />
      <ParticleBackground />
      <div className={styles.hero} data-cursor-grow>
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

// Helper: Get recently accessed set IDs from localStorage
function getRecentSetIds(): string[] {
  try {
    const recent = localStorage.getItem('recent_sets')
    return recent ? JSON.parse(recent) : []
  } catch {
    return []
  }
}

// Helper: Track a set as recently accessed
export function trackRecentSet(setId: string) {
  try {
    const recent = getRecentSetIds()
    const filtered = recent.filter(id => id !== setId)
    const updated = [setId, ...filtered].slice(0, 10) // Keep last 10
    localStorage.setItem('recent_sets', JSON.stringify(updated))
  } catch {
    // Ignore
  }
}

// Helper: Calculate progress percentage
function getProgressPercentage(progress: Array<{ level: string }>): number {
  if (!progress?.length) return 0
  const studied = progress.filter(p => p.level !== 'not_studied').length
  return Math.round((studied / progress.length) * 100)
}

function ContinueStudyingSection({ sets, studentId }: { sets: any[], studentId: number | null }) {
  const [continueData, setContinueData] = useState<Array<{ set: any, progress: any, percentage: number }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!studentId || sets.length === 0) return

    const recentIds = getRecentSetIds()
    if (recentIds.length === 0) return

    setLoading(true)
    Promise.all(
      recentIds
        .slice(0, 4)
        .filter(id => sets.some(s => s.id === id))
        .map(async (setId) => {
          try {
            const progress = await fetchProgress(studentId, setId)
            const set = sets.find(s => s.id === setId)
            const percentage = getProgressPercentage(progress)
            return { set, progress, percentage }
          } catch {
            return null
          }
        })
    )
      .then(results => setContinueData(results.filter(Boolean) as any))
      .finally(() => setLoading(false))
  }, [sets, studentId])

  if (loading || continueData.length === 0) return null

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Continue Studying</h2>
      </div>
      <div className={styles.continueGrid}>
        {continueData.map(({ set, percentage }) => (
          <a key={set.id} href={`/set/${set.id}`} className={styles.continueCard}>
            <div className={styles.continueTop}>
              <div className={styles.continueName}>{set.name}</div>
              <div className={styles.continueProgress}>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
                </div>
                <span className={styles.progressText}>{percentage}%</span>
              </div>
            </div>
            <div className={styles.continueBottom}>
              <span className={styles.continueMeta}>{set.word_count ?? 0} terms</span>
              <button className={styles.continueBtn}>
                <Play size={14} strokeWidth={2} /> Resume
              </button>
            </div>
          </a>
        ))}
      </div>
    </div>
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
            <Skeleton key={i} height="120px" borderRadius="10px" />
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

      <ContinueStudyingSection sets={sets} studentId={studentId} />

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Sets</h2>
        </div>
        <div className={styles.grid}>
          <a href={`/set/${STARTER_PACK_ID}`} className={`${styles.card} ${styles.cardStarter}`}>
            <div className={styles.cardContent}>
              <div className={styles.starterBadge}>Free for all</div>
              <div className={styles.name}>{STARTER_PACK_NAME}</div>
              <div className={styles.meta}>{STARTER_WORDS.length} terms</div>
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.lang}>EN</div>
              <Play size={16} strokeWidth={2} className={styles.hoverIcon} />
            </div>
          </a>

          {sets.map(set => (
            <a
              key={set.id}
              href={`/set/${set.id}`}
              className={styles.card}
              onClick={() => trackRecentSet(set.id)}
            >
              <div className={styles.cardContent}>
                <div className={styles.name}>{set.name}</div>
                {set.word_count !== undefined && (
                  <div className={styles.meta}>{set.word_count} terms</div>
                )}
              </div>
              <div className={styles.cardFooter}>
                {set.language && (
                  <div className={styles.lang}>{set.language.toUpperCase()}</div>
                )}
                <Play size={16} strokeWidth={2} className={styles.hoverIcon} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
