import { getCachedAudio, setCachedAudio } from '../lib/audioCache'

export async function playWord(text: string, audioUrl: string | null) {
  if (!audioUrl) {
    speakText(text)
    return
  }

  try {
    // Check cache first
    const cachedBlob = await getCachedAudio(audioUrl)
    if (cachedBlob) {
      const blobUrl = URL.createObjectURL(cachedBlob)
      const audio = new Audio(blobUrl)
      audio.onended = () => URL.revokeObjectURL(blobUrl)
      audio.play().catch(() => speakText(text))
      return
    }

    // Fetch from network and cache
    const res = await fetch(audioUrl)
    if (!res.ok) {
      speakText(text)
      return
    }

    const blob = await res.blob()
    await setCachedAudio(audioUrl, text, blob)

    const blobUrl = URL.createObjectURL(blob)
    const audio = new Audio(blobUrl)
    audio.onended = () => URL.revokeObjectURL(blobUrl)
    audio.play().catch(() => speakText(text))
  } catch {
    speakText(text)
  }
}

function speakText(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'en-US'
  utt.rate = 0.9
  window.speechSynthesis.speak(utt)
}
