import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider, useSession } from './context/SessionContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Matches from './pages/Matches'
import Prediction from './pages/Prediction'
import History from './pages/History'
import Standings from './pages/Standings'
import ViewPredictions from './pages/ViewPredictions'
import Admin from './pages/Admin'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useSession()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAdmin } = useSession()
  return isAdmin ? children : <Navigate to="/partidos" replace />
}

function PublicRoute({ children }) {
  const { isLoggedIn } = useSession()
  return isLoggedIn ? <Navigate to="/partidos" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/registro" element={<PublicRoute><Register /></PublicRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/partidos" element={<Matches />} />
        <Route path="/partidos/:matchId/pronostico" element={<Prediction />} />
        <Route path="/partidos/:matchId/ver" element={<ViewPredictions />} />
        <Route path="/historial" element={<History />} />
        <Route path="/tabla" element={<Standings />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/partidos" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SessionProvider>
  )
}
