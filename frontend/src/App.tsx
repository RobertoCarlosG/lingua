import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ReviewPage } from '@/pages/ReviewPage'
import { VocabularyPage } from '@/pages/VocabularyPage'
import { ErrorBankPage } from '@/pages/ErrorBankPage'
import { LessonsPage } from '@/pages/LessonsPage'
import { ExplorePage } from '@/pages/ExplorePage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="vocabulary" element={<VocabularyPage />} />
            <Route path="errors" element={<ErrorBankPage />} />
            <Route path="lessons" element={<LessonsPage />} />
            <Route path="explore" element={<ExplorePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
