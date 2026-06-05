import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Camera, Loader } from 'lucide-react'
import { getGoogleUser } from '../utils/auth'
import { fetchWords } from '../api/client'
import type { VocabSet, Word } from '../types'
import { Toast } from '../components/ui/Toast'
import styles from './TeacherPage.module.css'

export function TeacherPage() {
  const navigate = useNavigate()
  const googleUser = getGoogleUser()

  // Auth check
  if (!googleUser) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Teacher Panel</h1>
        </div>
        <div className={styles.authRequiredBox}>
          <p>You must be logged in to access the teacher panel.</p>
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

  // State
  const [sets, setSets] = useState<VocabSet[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null)
  const [setWords, setSetWords] = useState<Record<string, Word[]>>({})
  const [loadingSetWords, setLoadingSetWords] = useState<Record<string, boolean>>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSetName, setNewSetName] = useState('')
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [currentSetIdForWord, setCurrentSetIdForWord] = useState<string | null>(null)
  const [newWord, setNewWord] = useState({ word_en: '', word_uk: '' })
  const [editingWordId, setEditingWordId] = useState<string | null>(null)
  const [editingWord, setEditingWord] = useState<Word | null>(null)

  // Loading states
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Screenshot state
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [screenshotCustomName, setScreenshotCustomName] = useState('')
  const [screenshotLoading, setScreenshotLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  // Load sets (mock - will call backend)
  useEffect(() => {
    setTimeout(() => {
      // TODO: Replace with actual API call
      // For now, show empty state or load from backend when available
      setSets([])
      setLoading(false)
    }, 500)
  }, [])

  // Toggle set expansion and load words
  const toggleSetExpanded = async (setId: string) => {
    if (expandedSetId === setId) {
      setExpandedSetId(null)
    } else {
      setExpandedSetId(setId)
      if (!setWords[setId]) {
        setLoadingSetWords(prev => ({ ...prev, [setId]: true }))
        try {
          const words = await fetchWords(setId)
          setSetWords(prev => ({ ...prev, [setId]: words }))
        } catch (err) {
          console.error('Failed to load words:', err)
          setSetWords(prev => ({ ...prev, [setId]: [] }))
        } finally {
          setLoadingSetWords(prev => ({ ...prev, [setId]: false }))
        }
      }
    }
  }

  // Create new set
  const handleCreateSet = async () => {
    if (!newSetName.trim()) return

    const user = getGoogleUser()
    if (!user) {
      alert('Not logged in')
      return
    }

    try {
      const response = await fetch('https://english-bot.gssdarm.workers.dev/vocab-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSetName.trim(),
          google_email: user.email,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        alert(`Error: ${err.error || 'Failed to create set'}`)
        return
      }

      const data = await response.json()
      const newSet: VocabSet = {
        id: data.setId,
        name: data.name,
        word_count: 0,
        language: 'uk',
      }
      setSets(prev => [...prev, newSet])
      setNewSetName('')
      setShowCreateModal(false)
    } catch (err) {
      console.error('Create set error:', err)
      alert('Failed to create set')
    }
  }

  // Delete set
  const handleDeleteSet = async (setId: string) => {
    if (!confirm('Are you sure you want to delete this set?')) return
    // TODO: Call backend API to delete set
    alert(`Set would be deleted. Backend endpoint needed: DELETE /vocab-sets/${setId}`)
  }

  // Add word to set
  const handleAddWord = async () => {
    if (!newWord.word_en.trim() || !currentSetIdForWord) return

    setIsAdding(true)
    try {
      const response = await fetch('https://english-bot.gssdarm.workers.dev/vocab-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          set_id: currentSetIdForWord,
          word_en: newWord.word_en.trim(),
          word_uk: newWord.word_uk.trim() || null,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        setToastMessage(`Error: ${err.error || 'Failed to add word'}`)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 4000)
        return
      }

      const addedWord = await response.json()

      // Update local words state
      setSetWords(prev => ({
        ...prev,
        [currentSetIdForWord]: [...(prev[currentSetIdForWord] || []), addedWord],
      }))

      // Update set word count
      setSets(prev =>
        prev.map(s =>
          s.id === currentSetIdForWord
            ? { ...s, word_count: (s.word_count ?? 0) + 1 }
            : s
        )
      )

      setToastMessage('Word added successfully!')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)

      setNewWord({ word_en: '', word_uk: '' })
      setShowAddWordModal(false)
    } catch (err) {
      console.error('Add word error:', err)
      setToastMessage('Failed to add word')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    } finally {
      setIsAdding(false)
    }
  }

  // Edit word
  const handleEditWord = async () => {
    if (!editingWord || !editingWordId) return

    setIsEditing(true)
    try {
      const response = await fetch(`https://english-bot.gssdarm.workers.dev/vocab-words/${editingWordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word_en: editingWord.word_en.trim(),
          word_uk: editingWord.word_uk?.trim() || null,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        setToastMessage(`Error: ${err.error || 'Failed to update word'}`)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 4000)
        return
      }

      const updatedWord = await response.json()

      // Update local words state
      setSetWords(prev => {
        const setId = Object.keys(prev).find(id =>
          prev[id].some(w => w.id === editingWordId)
        )
        if (!setId) return prev

        return {
          ...prev,
          [setId]: prev[setId].map(w => (w.id === editingWordId ? updatedWord : w)),
        }
      })

      setToastMessage('Word updated successfully!')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)

      setEditingWord(null)
      setEditingWordId(null)
    } catch (err) {
      console.error('Edit word error:', err)
      setToastMessage('Failed to update word')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    } finally {
      setIsEditing(false)
    }
  }

  // Delete word
  const handleDeleteWord = async (wordId: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return

    setIsDeleting(wordId)
    try {
      const response = await fetch(`https://english-bot.gssdarm.workers.dev/vocab-words/${wordId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const err = await response.json()
        setToastMessage(`Error: ${err.error || 'Failed to delete word'}`)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 4000)
        return
      }

      // Remove from local state
      setSetWords(prev => {
        const updated: Record<string, Word[]> = {}
        for (const setId in prev) {
          updated[setId] = prev[setId].filter(w => w.id !== wordId)
        }
        return updated
      })

      // Update set word count
      setSets(prev =>
        prev.map(s => ({
          ...s,
          word_count: Math.max(0, (s.word_count ?? 0) - 1),
        }))
      )

      setToastMessage('Word deleted successfully!')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (err) {
      console.error('Delete word error:', err)
      setToastMessage('Failed to delete word')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    } finally {
      setIsDeleting(null)
    }
  }

  const openAddWordModal = (setId: string) => {
    setCurrentSetIdForWord(setId)
    setNewWord({ word_en: '', word_uk: '' })
    setShowAddWordModal(true)
  }

  const openEditWordModal = (word: Word) => {
    setEditingWordId(word.id)
    setEditingWord({ ...word })
  }

  const closeAddWordModal = () => {
    setShowAddWordModal(false)
    setCurrentSetIdForWord(null)
    setNewWord({ word_en: '', word_uk: '' })
  }

  const closeEditWordModal = () => {
    setEditingWordId(null)
    setEditingWord(null)
  }

  // Screenshot handler
  const handleTakeScreenshot = async () => {
    if (!selectedSetId) return

    const set = sets.find(s => s.id === selectedSetId)
    if (!set) return

    setScreenshotLoading(true)

    try {
      const url = `https://studify-up.vercel.app/set/${selectedSetId}`
      const screenshotName = screenshotCustomName.trim() || set.name

      const response = await fetch('http://localhost:3001/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          name: screenshotName,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const filePath = data.filePath || `./screenshots/${screenshotName}-${new Date().toISOString().split('T')[0]}.png`

      setToastMessage(`Screenshot saved to: ${filePath}`)
      setShowToast(true)

      setShowScreenshotModal(false)
      setSelectedSetId(null)
      setScreenshotCustomName('')

      setTimeout(() => setShowToast(false), 4000)
    } catch (err) {
      console.error('Screenshot error:', err)
      setToastMessage('Failed to take screenshot (is server running? Start with: cd studify-screenshot-service && npm start)')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 5000)
    } finally {
      setScreenshotLoading(false)
    }
  }

  const openScreenshotModal = (setId: string) => {
    setSelectedSetId(setId)
    const set = sets.find(s => s.id === setId)
    setScreenshotCustomName(set?.name || '')
    setShowScreenshotModal(true)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Teacher Panel</h1>
            <p className={styles.subtitle}>Create and manage English-Ukrainian vocabulary sets</p>
          </div>
          {sets.length > 0 && (
            <button
              className={styles.screenshotBtn}
              onClick={() => setShowScreenshotModal(true)}
              title="Take set screenshot"
            >
              <Camera size={18} strokeWidth={2} />
              Take Screenshot
            </button>
          )}
        </div>
      </div>

      <div className={styles.userCard}>
        <div className={styles.userInfo}>
          {googleUser.picture ? (
            <img
              src={googleUser.picture}
              alt={googleUser.name}
              className={styles.userAvatar}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={styles.userAvatarFallback}>
              {googleUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={styles.userDetails}>
            <div className={styles.userName}>{googleUser.name}</div>
            <div className={styles.userEmail}>{googleUser.email}</div>
          </div>
        </div>
        <button
          className={styles.createSetBtn}
          onClick={() => setShowCreateModal(true)}
          title="Create new vocabulary set"
        >
          <Plus size={18} strokeWidth={2} />
          New Set
        </button>
      </div>

      {/* Sets List */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Sets</h2>
        {loading ? (
          <p className={styles.emptyMessage}>Loading...</p>
        ) : sets.length === 0 ? (
          <div className={styles.emptyStateBox}>
            <p className={styles.emptyMessage}>No vocabulary sets yet.</p>
            <p className={styles.emptyHint}>Create a set of English-Ukrainian words to get started. Click <strong>"+ New Set"</strong> above to create one.</p>
          </div>
        ) : (
          <div className={styles.setsList}>
            {sets.map(set => (
              <div key={set.id} className={styles.setItem}>
                <div
                  className={styles.setHeader}
                  onClick={() => toggleSetExpanded(set.id)}
                >
                  <div className={styles.setInfo}>
                    <h3 className={styles.setName}>{set.name}</h3>
                    <span className={styles.wordCount}>
                      {set.word_count ?? 0} words
                    </span>
                  </div>
                  <div className={styles.setActions}>
                    <button
                      className={styles.iconBtn}
                      onClick={e => {
                        e.stopPropagation()
                        openScreenshotModal(set.id)
                      }}
                      title="Take screenshot"
                    >
                      <Camera size={16} strokeWidth={2} />
                    </button>
                    <button
                      className={styles.iconBtn}
                      onClick={e => {
                        e.stopPropagation()
                        // Edit set
                        alert('Edit set coming soon')
                      }}
                      title="Edit set"
                    >
                      <Edit2 size={16} strokeWidth={2} />
                    </button>
                    <button
                      className={styles.iconBtn}
                      onClick={e => {
                        e.stopPropagation()
                        handleDeleteSet(set.id)
                      }}
                      title="Delete set"
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                    {expandedSetId === set.id ? (
                      <ChevronUp size={18} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={18} strokeWidth={2} />
                    )}
                  </div>
                </div>

                {/* Expanded Words List */}
                {expandedSetId === set.id && (
                  <div className={styles.setContent}>
                    {loadingSetWords[set.id] ? (
                      <p className={styles.loadingWords}>Loading words...</p>
                    ) : (setWords[set.id] ?? []).length === 0 ? (
                      <p className={styles.noWordsMessage}>No words in this set yet.</p>
                    ) : (
                      <div className={styles.wordsList}>
                        {(setWords[set.id] ?? []).map(word => (
                          <div key={word.id} className={styles.wordItem}>
                            <div className={styles.wordContent}>
                              <div className={styles.wordEnglish}>{word.word_en}</div>
                              <div className={styles.wordUkrainian}>
                                {word.word_uk || '—'}
                              </div>
                            </div>
                            <div className={styles.wordItemActions}>
                              <button
                                className={styles.iconBtn}
                                onClick={() => openEditWordModal(word)}
                                title="Edit word"
                              >
                                <Edit2 size={14} strokeWidth={2} />
                              </button>
                              <button
                                className={styles.iconBtn}
                                onClick={() => handleDeleteWord(word.id)}
                                title="Delete word"
                                disabled={isDeleting === word.id}
                              >
                                {isDeleting === word.id ? (
                                  <Loader size={14} strokeWidth={2} className={styles.spinnerIcon} />
                                ) : (
                                  <Trash2 size={14} strokeWidth={2} />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      className={styles.addWordBtn}
                      onClick={() => openAddWordModal(set.id)}
                    >
                      <Plus size={16} strokeWidth={2} />
                      Add Word
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Set Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create New Set</h2>
            <input
              type="text"
              className={styles.input}
              placeholder="Set name (e.g., 'Unit 5')"
              value={newSetName}
              onChange={e => setNewSetName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateSet()
              }}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleCreateSet}
                disabled={!newSetName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Word Modal */}
      {showAddWordModal && (
        <div className={styles.modalOverlay} onClick={closeAddWordModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Add Word</h2>
            <input
              type="text"
              className={styles.input}
              placeholder="English word"
              value={newWord.word_en}
              onChange={e => setNewWord(prev => ({ ...prev, word_en: e.target.value }))}
              autoFocus
            />
            <input
              type="text"
              className={styles.input}
              placeholder="Ukrainian translation (optional)"
              value={newWord.word_uk}
              onChange={e => setNewWord(prev => ({ ...prev, word_uk: e.target.value }))}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={closeAddWordModal}
                disabled={isAdding}
              >
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleAddWord}
                disabled={!newWord.word_en.trim() || isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader size={16} strokeWidth={2} className={styles.spinnerIcon} />
                    Adding...
                  </>
                ) : (
                  'Add'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Word Modal */}
      {editingWordId && editingWord && (
        <div className={styles.modalOverlay} onClick={closeEditWordModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Edit Word</h2>
            <input
              type="text"
              className={styles.input}
              placeholder="English word"
              value={editingWord.word_en}
              onChange={e =>
                setEditingWord(prev =>
                  prev ? { ...prev, word_en: e.target.value } : null
                )
              }
              autoFocus
            />
            <input
              type="text"
              className={styles.input}
              placeholder="Ukrainian translation (optional)"
              value={editingWord.word_uk || ''}
              onChange={e =>
                setEditingWord(prev =>
                  prev ? { ...prev, word_uk: e.target.value } : null
                )
              }
            />
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={closeEditWordModal}
                disabled={isEditing}
              >
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleEditWord}
                disabled={!editingWord.word_en.trim() || isEditing}
              >
                {isEditing ? (
                  <>
                    <Loader size={16} strokeWidth={2} className={styles.spinnerIcon} />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Modal */}
      {showScreenshotModal && (
        <div className={styles.modalOverlay} onClick={() => setShowScreenshotModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Take Set Screenshot</h2>
            <div>
              <label className={styles.label}>Select Set</label>
              <select
                className={styles.select}
                value={selectedSetId || ''}
                onChange={e => setSelectedSetId(e.target.value)}
              >
                <option value="">Choose a set...</option>
                {sets.map(set => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={styles.label}>Custom Filename (optional)</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g., my-vocab-set"
                value={screenshotCustomName}
                onChange={e => setScreenshotCustomName(e.target.value)}
              />
              <p className={styles.inputHint}>
                Default: {selectedSetId ? sets.find(s => s.id === selectedSetId)?.name : 'set name'}
              </p>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowScreenshotModal(false)}
                disabled={screenshotLoading}
              >
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleTakeScreenshot}
                disabled={!selectedSetId || screenshotLoading}
              >
                {screenshotLoading ? (
                  <>
                    <Loader size={16} strokeWidth={2} className={styles.spinnerIcon} />
                    Taking...
                  </>
                ) : (
                  <>
                    <Camera size={16} strokeWidth={2} />
                    Take Screenshot
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage} visible={showToast} />
    </div>
  )
}
