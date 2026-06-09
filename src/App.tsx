import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BattlePage from '@/pages/Battle'
import HomePage from '@/pages/Home'
import ResultPage from '@/pages/Result'
import SettingsPage from '@/pages/Settings'
import WorkshopPage from '@/pages/Workshop'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/workshop" element={<WorkshopPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
