import { useState, useMemo } from 'react'
import { detectColumns, extractWords } from '../../utils/csvParser'
import styles from './ImportSteps.module.css'

interface Step2ConfigureProps {
  rows: string[][]
  onNext: (words: Array<{ word_en: string; word_uk: string }>) => void
  onBack: () => void
}

type ColumnType = 'english' | 'ukrainian' | 'ignore'

export function Step2Configure({ rows, onNext, onBack }: Step2ConfigureProps) {
  const headers = rows[0] || []
  const { englishIndex: defaultEn, ukrainianIndex: defaultUk } = detectColumns(rows)

  const [columnTypes, setColumnTypes] = useState<ColumnType[]>(
    headers.map((_, i) => {
      if (i === defaultEn) return 'english'
      if (i === defaultUk) return 'ukrainian'
      return 'ignore'
    })
  )

  const words = useMemo(() => {
    const enIdx = columnTypes.findIndex((t) => t === 'english')
    const ukIdx = columnTypes.findIndex((t) => t === 'ukrainian')

    if (enIdx === -1 || ukIdx === -1) return []
    return extractWords(rows, enIdx, ukIdx)
  }, [columnTypes, rows])

  const hasError = !columnTypes.includes('english') || !columnTypes.includes('ukrainian')

  return (
    <div className={styles.step}>
      <h2 className={styles.title}>🔄 Step 2: Configure Columns</h2>
      <p className={styles.subtitle}>Select which column is English and which is Ukrainian</p>

      <table className={styles.configTable}>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i}>
                <select
                  value={columnTypes[i]}
                  onChange={(e) => {
                    const newTypes = [...columnTypes]
                    newTypes[i] = e.target.value as ColumnType
                    setColumnTypes(newTypes)
                  }}
                  className={styles.select}
                >
                  <option value="english">🇬🇧 English</option>
                  <option value="ukrainian">🇺🇦 Ukrainian</option>
                  <option value="ignore">⊘ Ignore</option>
                </select>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1, 6).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={columnTypes[j] === 'ignore' ? styles.ignore : ''}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {hasError && (
        <div className={styles.error}>
          ❌ Select both English and Ukrainian columns
        </div>
      )}

      {!hasError && (
        <div className={styles.success}>
          ✅ Ready to import {words.length} words
        </div>
      )}

      <div className={styles.buttons}>
        <button className={styles.buttonSecondary} onClick={onBack}>
          ← Back
        </button>
        <button
          className={styles.button}
          onClick={() => onNext(words)}
          disabled={hasError}
        >
          Next ✓
        </button>
      </div>
    </div>
  )
}
