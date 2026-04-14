import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import AuthGuard from './components/AuthGuard'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'
import Settings from './pages/Settings'
import LogMeal from './pages/LogMeal'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Progress from './pages/Progress'

// Checks if the current user has a profile; redirects to /setup if not
function ProfileGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'has-profile' | 'no-profile'>('loading')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatus('no-profile')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      setStatus(data ? 'has-profile' : 'no-profile')
    }

    check()
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  if (status === 'no-profile') {
    return <Navigate to="/setup" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Auth-protected */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <ProfileGuard>
                <Dashboard />
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/setup"
          element={
            <AuthGuard>
              <ProfileSetup />
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          }
        />
        <Route
          path="/log"
          element={
            <AuthGuard>
              <LogMeal />
            </AuthGuard>
          }
        />
        <Route
          path="/history"
          element={
            <AuthGuard>
              <History />
            </AuthGuard>
          }
        />
        <Route
          path="/progress"
          element={
            <AuthGuard>
              <Progress />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
