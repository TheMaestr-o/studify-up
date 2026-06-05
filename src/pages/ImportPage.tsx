import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Step1Upload } from '../components/import/Step1Upload'
import { Step2Configure } from '../components/import/Step2Configure'
import { Step3Details } from '../components/import/Step3Details'
import { submitImport } from '../api/client'
import styles from './ImportPage.module.css'

type ImportStep = 1 | 2 | 3

interface ImportState {
  rows: string[][]
  words: Array<{ word_en: string; word_uk: string }>
}

export function ImportPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<ImportStep>(1)
  const [state, setState] = useState<ImportState>({ rows: [], words: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleStep1Next = (rows: string[][]) => {
    setState((prev) => ({ ...prev, rows }))
    setStep(2)
  }

  const handleStep2Next = (words: Array<{ word_en: string; word_uk: string }>) => {
    setState((prev) => ({ ...prev, words }))
    setStep(3)
  }

  const handleStep3Submit = async (setName: string, language: string) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await submitImport(setName, language, state.words)
      setSuccess(`✅ Successfully imported ${result.importedCount} words! Redirecting...`)
      setTimeout(() => {
        navigate(`/set/${result.setId}`)
      }, 2000)
    } catch (e) {
      setError(`❌ Import failed: ${(e as Error).message}`)
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className={styles.title}>Import from Quizlet</h1>
          <p className={styles.subtitle}>
            Step {step} of 3: {step === 1 ? 'Upload' : step === 2 ? 'Configure' : 'Finalize'}
          </p>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className={styles.progress}>
        {[1, 2, 3].map((s) => (
          <div key={s} className={`${styles.progressStep} ${s <= step ? styles.active : ''}`}>
            {s}
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        {step === 1 && <Step1Upload onNext={handleStep1Next} />}
        {step === 2 && (
          <Step2Configure
            rows={state.rows}
            onNext={handleStep2Next}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Details
            words={state.words}
            onSubmit={handleStep3Submit}
            onBack={() => setStep(2)}
            isLoading={loading}
          />
        )}
      </div>

      {/* MESSAGES */}
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}
    </div>
  )
}
