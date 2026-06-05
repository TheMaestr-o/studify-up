import { useState } from 'react'
import styles from './ImportSteps.module.css'

interface Step3DetailsProps {
  words: Array<{ word_en: string; word_uk: string }>
  onSubmit: (setName: string, language: string) => void
  onBack: () => void
  isLoading?: boolean
}

export function Step3Details({ words, onSubmit, onBack, isLoading = false }: Step3DetailsProps) {
  const [setName, setSetName] = useState('')
  const [language, setLanguage] = useState('UK')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!setName.trim()) {
      alert('❌ Please enter a set name')
      return
    }
    onSubmit(setName, language)
  }

  return (
    <div className={styles.step}>
      <h2 className={styles.title}>📚 Step 3: Set Details</h2>
      <p className={styles.subtitle}>Give your vocabulary set a name</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Set Name *</label>
          <input
            type="text"
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            placeholder="e.g., Dophamine #66 At the airport"
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={styles.select}
            disabled={isLoading}
          >
            <option value="UK">🇺🇦 English → Ukrainian</option>
            <option value="RU">🇷🇺 English → Russian</option>
            <option value="ES">🇪🇸 English → Spanish</option>
            <option value="FR">🇫🇷 English → French</option>
            <option value="DE">🇩🇪 English → German</option>
            <option value="PL">🇵🇱 English → Polish</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes about this vocabulary set..."
            className={styles.textarea}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className={styles.summary}>
          <p>📊 You're about to import:</p>
          <ul>
            <li><strong>{words.length}</strong> words</li>
            <li>Set: <strong>{setName || '(no name yet)'}</strong></li>
            <li>Language: <strong>{language}</strong></li>
          </ul>
        </div>

        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={onBack}
            disabled={isLoading}
          >
            ← Back
          </button>
          <button
            type="submit"
            className={styles.button}
            disabled={isLoading || !setName.trim()}
          >
            {isLoading ? '⏳ Importing...' : '✓ Import Now'}
          </button>
        </div>
      </form>
    </div>
  )
}
