import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FoodLogProvider } from './context/FoodLogContext'
import { useSettings } from './hooks/useSettings'
import Layout from './components/Layout'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const History = lazy(() => import('./pages/History'))
const Settings = lazy(() => import('./pages/Settings'))
const Scanner = lazy(() => import('./pages/Scanner'))
const Progress = lazy(() => import('./pages/Progress'))
const Onboarding = lazy(() => import('./pages/Onboarding'))

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function OnboardingGate() {
  const { hasOnboarded, loading, markOnboarded } = useSettings()

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  if (!hasOnboarded) {
    return <Onboarding onComplete={markOnboarded} />
  }

  return <Layout />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="loading-screen"><div className="spinner" /></div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <FoodLogProvider>
                    <OnboardingGate />
                  </FoodLogProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="scanner" element={<Scanner />} />
              <Route path="progress" element={<Progress />} />
              <Route path="history" element={<History />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
