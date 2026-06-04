import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { SetPage } from './pages/SetPage'
import { Flashcards } from './modes/flashcards/Flashcards'
import { Match } from './modes/match/Match'
import { Learn } from './modes/learn/Learn'
import { Test } from './modes/test/Test'
import { Blocks } from './modes/blocks/Blocks'
import { Blast } from './modes/blast/Blast'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/set/:setId" element={<SetPage />} />
        <Route path="/set/:setId/flashcards" element={<Flashcards />} />
        <Route path="/set/:setId/match" element={<Match />} />
        <Route path="/set/:setId/learn" element={<Learn />} />
        <Route path="/set/:setId/test" element={<Test />} />
        <Route path="/set/:setId/blocks" element={<Blocks />} />
        <Route path="/set/:setId/blast" element={<Blast />} />
      </Route>
    </Routes>
  )
}
