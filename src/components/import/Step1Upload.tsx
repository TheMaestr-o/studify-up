import { useState } from 'react'
import { Upload } from 'lucide-react'
import { parseCSV } from '../../utils/csvParser'
import styles from './ImportSteps.module.css'

interface Step1UploadProps {
  onNext: (rows: string[][]) => void
}

export function Step1Upload({ onNext }: Step1UploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string[][]>([])

  const handleFileSelect = async (selectedFile: File) => {
    setError('')
    setPreview([])

    if (!selectedFile.name.match(/\.(csv|xlsx?)$/i)) {
      setError('❌ Only CSV and Excel files are supported')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('❌ File is too large (max 10MB)')
      return
    }

    setLoading(true)
    try {
      const rows = await parseCSV(selectedFile)
      setFile(selectedFile)
      setPreview(rows.slice(0, 5))
      setLoading(false)
    } catch (e) {
      setError(`❌ Failed to parse file: ${(e as Error).message}`)
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleFileSelect(file)
    }
    input.click()
  }

  return (
    <div className={styles.step}>
      <h2 className={styles.title}>📥 Step 1: Upload CSV File</h2>
      <p className={styles.subtitle}>
        Export from Quizlet (English | Definition) and upload here
      </p>

      <div
        className={styles.dropZone}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={handleClick}
      >
        <Upload size={48} color="#4255FF" />
        <p className={styles.dropText}>
          {file ? `📄 ${file.name}` : 'Drag & drop or click to select'}
        </p>
        <p className={styles.dropHint}>CSV, XLS, XLSX · Max 10MB</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading && <div className={styles.loading}>⏳ Parsing file...</div>}

      {preview.length > 0 && (
        <div className={styles.preview}>
          <p className={styles.previewTitle}>Preview (first 5 rows):</p>
          <table className={styles.table}>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        className={styles.button}
        onClick={() => file && onNext(preview)}
        disabled={!file || loading}
      >
        ✓ Next
      </button>
    </div>
  )
}
