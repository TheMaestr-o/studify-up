export function playWord(text: string, audioUrl: string | null) {
  if (audioUrl) {
    new Audio(audioUrl).play().catch(() => speakText(text))
  } else {
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
