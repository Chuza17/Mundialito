import { Navigate, Outlet } from 'react-router-dom'
import LoadingSpinner from '../common/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) return <div className="p-8"><LoadingSpinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
