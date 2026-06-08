import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Download, Mail, RotateCcw, ArrowLeft, Loader } from 'lucide-react'
import { getGoogleUser, getLinkedStudentId } from '../utils/auth'
import { fetchSets, exportAnalytics } from '../api/client'
import { useAnalytics } from '../hooks/useAnalytics'
import { WordDifficultyTable } from '../components/analytics/WordDifficultyTable'
import { StudentPerformanceTable } from '../components/analytics/StudentPerformanceTable'
import { Toast } from '../components/ui/Toast'
import type { VocabSet } from '../types'
import styles from './TeacherAnalyticsPage.module.css'

export function TeacherAnalyticsPage() {
  const navigate = useNavigate()
  const { setId: paramSetId } = useParams()
  const googleUser = getGoogleUser()

  // Auth check
  if (!googleUser) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/teacher')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>Analytics</h1>
        </div>
        <div className={styles.authRequiredBox}>
          <p>You must be logged in to access analytics.</p>
          <button
            className={styles.loginBtn}
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const [sets, setSets] = useState<VocabSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string>(paramSetId || '')
  const [loadingSets, setLoadingSets] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  const { analyticsData, loading, error, getAnalytics } = useAnalytics()

  // Auto-dismiss toast
  useEffect(() => {
    if (showToast) {
      const timeout = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(timeout)
    }
  }, [showToast])

  // Load teacher's sets
  useEffect(() => {
    const loadSets = async () => {
      try {
        const studentId = getLinkedStudentId()
        if (!studentId) return
        const data = await fetchSets(studentId)
        setSets(data)
        // Auto-select first set if param not provided
        if (!paramSetId && data.length > 0) {
          const firstSet = data[0]
          setSelectedSetId(firstSet.id)
          await getAnalytics(firstSet.id)
        } else if (paramSetId) {
          await getAnalytics(paramSetId)
        }
      } catch (err) {
        console.error('Failed to load sets:', err)
      } finally {
        setLoadingSets(false)
      }
    }

    loadSets()
  }, [googleUser, paramSetId, getAnalytics])

  // Load analytics when selected set changes
  useEffect(() => {
    if (selectedSetId && selectedSetId !== paramSetId) {
      getAnalytics(selectedSetId)
    }
  }, [selectedSetId])

  const handleSetChange = (setId: string) => {
    setSelectedSetId(setId)
  }

  const handleExport = async () => {
    if (!selectedSetId) return
    setExporting(true)
    try {
      const response = await exportAnalytics(selectedSetId)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics_${selectedSetId}.csv`
      a.click()
      URL.revokeObjectURL(url)

      setToastMessage('✅ Analytics exported successfully')
      setShowToast(true)
    } catch (err) {
      setToastMessage('❌ Export failed')
      setShowToast(true)
    } finally {
      setExporting(false)
    }
  }

  const handleEmailReport = () => {
    setToastMessage('📧 Email feature coming soon')
    setShowToast(true)
  }

  const handleReset = () => {
    setToastMessage('🔄 Reset feature coming soon')
    setShowToast(true)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/teacher')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Analytics Dashboard</h1>
      </div>

      <div className={styles.container}>
        {/* Set Selector */}
        <div className={styles.selectorSection}>
          <label htmlFor="set-select" className={styles.label}>
            Select Vocab Set:
          </label>
          <select
            id="set-select"
            value={selectedSetId}
            onChange={e => handleSetChange(e.target.value)}
            className={styles.select}
            disabled={loadingSets}
          >
            <option value="">Choose a set...</option>
            {sets.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stats Cards */}
        {analyticsData && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analyticsData.overall_stats.total_students}</div>
                <div className={styles.statLabel}>Total Students</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {analyticsData.overall_stats.avg_mastery_pct.toFixed(1)}%
                </div>
                <div className={styles.statLabel}>Avg Mastery %</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {analyticsData.overall_stats.avg_attempts.toFixed(1)}
                </div>
                <div className={styles.statLabel}>Avg Attempts/Word</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analyticsData.word_stats.length}</div>
                <div className={styles.statLabel}>Total Words</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                className={styles.actionBtn}
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? <Loader size={16} className={styles.spinner} /> : <Download size={16} />}
                Export PDF
              </button>
              <button
                className={styles.actionBtn}
                onClick={handleEmailReport}
              >
                <Mail size={16} />
                Email Report
              </button>
              <button
                className={styles.actionBtn}
                onClick={handleReset}
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            {/* Word Difficulty Section */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Word Difficulty (Hardest First)</h2>
              <WordDifficultyTable
                words={analyticsData.word_stats}
                onWordClick={() => {}}
                loading={loading}
              />
            </section>

            {/* Student Performance Section */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Student Performance</h2>
              <StudentPerformanceTable
                students={analyticsData.student_stats}
                loading={loading}
              />
            </section>
          </>
        )}

        {error && (
          <div className={styles.errorBox}>
            <p>Error: {error}</p>
          </div>
        )}

        {!selectedSetId && !error && (
          <div className={styles.emptyBox}>
            <p>Select a vocab set to view analytics</p>
          </div>
        )}

        {loading && selectedSetId && (
          <div className={styles.loadingBox}>
            <Loader size={32} className={styles.spinner} />
            <p>Loading analytics...</p>
          </div>
        )}
      </div>

      <Toast
        message={toastMessage}
        visible={showToast}
        duration={3000}
      />
    </div>
  )
}
