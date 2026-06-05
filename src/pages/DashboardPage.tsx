import { useEffect, useState } from 'react'
import { BookOpen, Target, RotateCw, Sparkles, TrendingUp } from 'lucide-react'
import { getLinkedStudentId, isLinkedAccount } from '../utils/auth'
import { useDashboard } from '../hooks/useDashboard'
import { RetentionChart } from '../components/dashboard/RetentionChart'
import { MasteryTimeline } from '../components/dashboard/MasteryTimeline'
import { NextReviewTable } from '../components/dashboard/NextReviewTable'
import styles from './DashboardPage.module.css'

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorMap = {
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    orange: '#f59e0b',
  }

  return (
    <div className={styles.statCard} style={{ borderTopColor: colorMap[color] }}>
      <div className={styles.statIcon} style={{ color: colorMap[color] }}>
        {Icon}
      </div>
      <div className={styles.statContent}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
      </div>
    </div>
  )
}

function MasteryPercentage({
  mastered,
  total,
}: {
  mastered: number
  total: number
}) {
  const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0

  return (
    <div className={styles.masteryContainer}>
      <div className={styles.masteryCircle}>
        <svg className={styles.masteryCircleSvg} viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" className={styles.masteryBackground} />
          <circle
            cx="60"
            cy="60"
            r="54"
            className={styles.masteryProgress}
            style={{
              strokeDasharray: `${percentage * 3.39} 339`,
            }}
          />
        </svg>
        <div className={styles.masteryText}>
          <span className={styles.masteryPercent}>{percentage}%</span>
          <span className={styles.masteryLabel}>Mastered</span>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const linked = isLinkedAccount()
  const studentId = getLinkedStudentId()
  const { stats, retention, nextReviews, masteryTimeline, loading, error } = useDashboard(linked ? studentId : null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0)
  }, [])

  if (!linked) {
    return (
      <div className={styles.page}>
        <div className={styles.notLinked}>
          <Sparkles size={48} />
          <h2>Dashboard coming soon</h2>
          <p>Link your account to see your learning progress</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Your Learning Progress</h1>
            <p className={styles.subtitle}>Loading your dashboard...</p>
          </div>
        </div>
        <div className={styles.skeleton} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Learning Progress</h1>
        </div>
        <div className={styles.errorBox}>
          <p className={styles.errorText}>{error}</p>
          <p className={styles.errorHint}>Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  const total = stats?.total ?? 0
  const mastered = stats?.mastered ?? 0
  const reviewing = stats?.reviewing ?? 0
  const newWords = stats?.new ?? 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Learning Progress</h1>
          <p className={styles.subtitle}>Track your spaced repetition journey</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          icon={<BookOpen size={24} />}
          label="Total Words"
          value={total}
          color="blue"
        />
        <StatCard
          icon={<Target size={24} />}
          label="Mastered"
          value={mastered}
          color="green"
        />
        <StatCard
          icon={<RotateCw size={24} />}
          label="Reviewing"
          value={reviewing}
          color="orange"
        />
        <StatCard
          icon={<Sparkles size={24} />}
          label="New"
          value={newWords}
          color="purple"
        />
      </div>

      {/* Mastery Progress */}
      {total > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Overall Mastery</h2>
          <div className={styles.masterySection}>
            <MasteryPercentage mastered={mastered} total={total} />
            <div className={styles.masteryStats}>
              <div className={styles.masteryStatItem}>
                <span className={styles.masteryStatLabel}>In Progress</span>
                <span className={styles.masteryStatValue}>{reviewing}</span>
              </div>
              <div className={styles.masteryStatItem}>
                <span className={styles.masteryStatLabel}>Not Started</span>
                <span className={styles.masteryStatValue}>{newWords}</span>
              </div>
              <div className={styles.masteryStatItem}>
                <span className={styles.masteryStatLabel}>Total to Learn</span>
                <span className={styles.masteryStatValue}>{total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={18} />
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'schedule' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <BookOpen size={18} />
          Next Reviews
        </button>
      </div>

      {/* Charts Section */}
      {activeTab === 'overview' && (
        <>
          {retention.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Retention Curve (Last 30 Days)</h2>
              <div className={styles.chartContainer}>
                <RetentionChart data={retention} />
              </div>
              <p className={styles.chartHint}>
                Green zone (80%+) = words you've mastered. Yellow zone (50-80%) = keep reviewing.
              </p>
            </div>
          )}

          {masteryTimeline.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Learning Curve (Last 30 Days)</h2>
              <div className={styles.chartContainer}>
                <MasteryTimeline data={masteryTimeline} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Next Reviews Section */}
      {activeTab === 'schedule' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Words Due for Review</h2>
          <NextReviewTable reviews={nextReviews} />
        </div>
      )}

      {/* Tips Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Pro Tips</h2>
        <div className={styles.tipsGrid}>
          <div className={styles.tipCard}>
            <span className={styles.tipIcon}>🎯</span>
            <h3>Consistent Practice</h3>
            <p>Review words daily to build strong long-term memory.</p>
          </div>
          <div className={styles.tipCard}>
            <span className={styles.tipIcon}>📈</span>
            <h3>Track Progress</h3>
            <p>Watch your mastery percentage grow as you complete reviews.</p>
          </div>
          <div className={styles.tipCard}>
            <span className={styles.tipIcon}>⏰</span>
            <h3>Optimal Timing</h3>
            <p>Study words when they're due for review to maximize retention.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
