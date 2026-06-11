import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { DashboardPage } from '@/pages/DashboardPage'
import { ReviewPage } from '@/pages/ReviewPage'
import { VocabularyPage } from '@/pages/VocabularyPage'
import { ErrorBankPage } from '@/pages/ErrorBankPage'
import { LessonsPage } from '@/pages/LessonsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="vocabulary" element={<VocabularyPage />} />
          <Route path="errors" element={<ErrorBankPage />} />
          <Route path="lessons" element={<LessonsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
