import { Navigate, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { NotFound } from './pages/NotFound'
import { SetPage } from './pages/SetPage'
import { SearchPage } from './pages/SearchPage'
import { ProfilePage } from './pages/ProfilePage'
import { TeacherPage } from './pages/TeacherPage'
import { TeacherAnalyticsPage } from './pages/TeacherAnalyticsPage'
import { ImportPage } from './pages/ImportPage'
import { DashboardPage } from './pages/DashboardPage'
import { Flashcards } from './modes/flashcards/Flashcards'
import { Match } from './modes/match/Match'
import { Learn } from './modes/learn/Learn'
import { Test } from './modes/test/Test'
import { Blocks } from './modes/blocks/Blocks'
import { Blast } from './modes/blast/Blast'
import { isLinkedAccount } from './utils/auth'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isLinkedAccount()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Public — no login needed */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/set/:setId" element={<SetPage />} />
        <Route path="/set/:setId/flashcards" element={<Flashcards />} />
        <Route path="/set/:setId/match" element={<Match />} />
        <Route path="/set/:setId/learn" element={<Learn />} />
        <Route path="/set/:setId/test" element={<Test />} />
        <Route path="/set/:setId/blocks" element={<Blocks />} />
        <Route path="/set/:setId/blast" element={<Blast />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Auth-required */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/search" element={<SearchPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="/analytics" element={<TeacherAnalyticsPage />} />
        <Route path="/analytics/:setId" element={<TeacherAnalyticsPage />} />
        <Route path="/import" element={<ImportPage />} />
      </Route>
    </Routes>
  )
}
