import Papa from 'papaparse'

export interface ParsedCSVData {
  rows: string[][]
  headers: string[]
  englishIndex: number
  ukrainianIndex: number
}

export function parseCSV(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as string[][]),
      error: (error) => reject(error),
    })
  })
}

export function detectColumns(rows: string[][]): {
  englishIndex: number
  ukrainianIndex: number
} {
  if (rows.length === 0) return { englishIndex: 0, ukrainianIndex: 1 }

  const headers = rows[0]
  const englishPatterns = /^(english|en|word|term|front|vocabulary|слово|eng)$/i
  const ukrainianPatterns = /^(ukrainian|uk|translation|back|definition|переклад|укр)$/i

  let englishIndex = -1
  let ukrainianIndex = -1

  headers.forEach((header, idx) => {
    const clean = header.toLowerCase().trim()
    if (englishPatterns.test(clean)) englishIndex = idx
    if (ukrainianPatterns.test(clean)) ukrainianIndex = idx
  })

  if (englishIndex === -1) englishIndex = 0
  if (ukrainianIndex === -1) ukrainianIndex = headers.length > 1 ? 1 : 0

  return { englishIndex, ukrainianIndex }
}

export function extractWords(
  rows: string[][],
  englishIdx: number,
  ukIdx: number
): Array<{ word_en: string; word_uk: string }> {
  const words: Array<{ word_en: string; word_uk: string }> = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const word_en = (row[englishIdx] ?? '').trim()
    const word_uk = (row[ukIdx] ?? '').trim()

    if (word_en) {
      words.push({ word_en, word_uk: word_uk || '—' })
    }
  }

  return words
}

export function validateWords(
  words: Array<{ word_en: string; word_uk: string }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (words.length === 0) {
    errors.push('No words found in file')
  }

  if (words.length > 1000) {
    errors.push('Maximum 1000 words per set')
  }

  const englishWords = new Set<string>()
  const duplicates: string[] = []

  words.forEach((w) => {
    if (englishWords.has(w.word_en.toLowerCase())) {
      duplicates.push(w.word_en)
    }
    englishWords.add(w.word_en.toLowerCase())
  })

  if (duplicates.length > 0) {
    errors.push(`Found ${duplicates.length} duplicate words: ${duplicates.slice(0, 3).join(', ')}...`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
