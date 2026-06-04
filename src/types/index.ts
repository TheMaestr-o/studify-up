export interface Word {
  id: string
  word_en: string
  word_uk: string | null
  audio_url: string | null
}

export interface VocabSet {
  id: string
  name: string
  language: string | null
  word_count?: number
}

export interface User {
  userId: number
  firstName: string
  username: string | null
}

export type QuestionType = 'mc' | 'written' | 'tf'
export type Direction = 'en_to_uk' | 'uk_to_en'
export type MasteryLevel = 'not_studied' | 'familiar' | 'mastered'
export type GameMode = 'flashcards' | 'learn' | 'match' | 'test' | 'blocks' | 'blast'

export interface Question {
  type: QuestionType
  word: Word
  options: string[]
  correct: string
  direction: Direction
}

export interface WordProgress {
  wordId: string
  level: MasteryLevel
  correctCount: number
  isStarred: boolean
}

export interface ReviewPayload {
  setId: string
  wordId: string
  correct: boolean
  responseTimeMs: number
}

export interface TelegramAuthData {
  id: number
  first_name: string
  username?: string
  photo_url?: string
  hash: string
  auth_date: number
}

export interface MatchCard {
  id: string
  text: string
  type: 'term' | 'definition'
  wordId: string
  isMatched: boolean
  isSelected: boolean
  isWrong: boolean
}
