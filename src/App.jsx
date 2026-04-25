import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FoodLogProvider } from './context/FoodLogContext'
import { ToastProvider } from './context/ToastContext'
import { useSettings } from './hooks/useSettings'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'

const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/home'))
const History = lazy(() => import('./pages/history'))
const Settings = lazy(() => import('./pages/settings'))
const Scanner = lazy(() => import('./pages/addmeal'))
const Progress = lazy(() => import('./pages/progress'))
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
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
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
                  <Route index element={<Home />} />
                  <Route path="scanner" element={<Scanner />} />
                  <Route path="progress" element={<Progress />} />
                  <Route path="history" element={<History />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
