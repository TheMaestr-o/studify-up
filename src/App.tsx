import { Navigate, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { NotFound } from './pages/NotFound'
import { SetPage } from './pages/SetPage'
import { SearchPage } from './pages/SearchPage'
import { ProfilePage } from './pages/ProfilePage'
import { Flashcards } from './modes/flashcards/Flashcards'
import { Match } from './modes/match/Match'
import { Learn } from './modes/learn/Learn'
import { Test } from './modes/test/Test'
import { Blocks } from './modes/blocks/Blocks'
import { Blast } from './modes/blast/Blast'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const userId = localStorage.getItem('userId')
  const googleUser = localStorage.getItem('googleUser')
  if (!userId || !googleUser) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Public route — viewable without login */}
      <Route element={<Layout />}>
        <Route path="/set/:setId" element={<SetPage />} />
      </Route>

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/set/:setId/flashcards" element={<Flashcards />} />
        <Route path="/set/:setId/match" element={<Match />} />
        <Route path="/set/:setId/learn" element={<Learn />} />
        <Route path="/set/:setId/test" element={<Test />} />
        <Route path="/set/:setId/blocks" element={<Blocks />} />
        <Route path="/set/:setId/blast" element={<Blast />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
