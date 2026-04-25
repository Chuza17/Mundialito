import { useMemo, useState } from 'react'
import { Activity, BarChart3, Crown, LayoutDashboard, Shield, Trophy, Users2 } from 'lucide-react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import PointerTrail from './components/common/PointerTrail'
import AppFooter from './components/layout/AppFooter'
import BottomNav from './components/layout/BottomNav'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Sidebar from './components/layout/Sidebar'
import { useAppConfig } from './hooks/useAppConfig'
import { useAuth } from './hooks/useAuth'
import AdminUsersPage from './pages/AdminUsersPage'
import BestThirdsPage from './pages/BestThirdsPage'
import DashboardServicesPage from './pages/DashboardServicesPage'
import GroupsPage from './pages/GroupsPage'
import KnockoutPage from './pages/KnockoutPage'
import LeaderboardPage from './pages/LeaderboardPage'
import PublicLoginPage from './pages/PublicLoginPage'
import MyPredictionPage from './pages/MyPredictionPage'
import SiteInfoPage from './pages/SiteInfoPage'
import ResultsPage from './pages/WorldCupResultsPage'
import UserPredictionPage from './pages/UserPredictionPage'

function AppLayout() {
  const { profile, logout, isAdmin } = useAuth()
  const { config } = useAppConfig()
  const location = useLocation()
  const isDashboard = location.pathname === '/dashboard'
  const [chromeHidden, setChromeHidden] = useState(false)

  const navItems = useMemo(() => {
    const items = [
      { to: '/dashboard', label: 'Dashboard', short: 'Inicio', icon: LayoutDashboard },
      { to: '/groups', label: 'Grupos', short: 'Grupos', icon: Trophy },
      { to: '/best-thirds', label: 'Mejores 3ros', short: '3ros', icon: Crown },
      { to: '/knockout', label: 'Eliminatorias', short: 'Bracket', icon: Shield },
      { to: '/results', label: 'Resultados', short: 'Resultados', icon: Activity },
      { to: '/scoreboard', label: 'Scoreboard', short: 'Board', icon: BarChart3 },
      { to: '/my-prediction', label: 'Mi Quiniela', short: 'Mi pick', icon: Users2 },
    ]
    if (isAdmin) {
      items.push({ to: '/admin/users', label: 'Gestion Usuarios', short: 'Admin', icon: Users2 })
    }
    return items
  }, [isAdmin])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1b3150,transparent_35%),linear-gradient(180deg,#07111f_0%,#0c1727_50%,#07111f_100%)] text-slate-100">
      <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 lg:px-8">
        <Navbar profile={profile} deadline={config?.deadline} isCinematic={isDashboard} onLogout={logout} />
        <div className={isDashboard || chromeHidden ? 'grid gap-6' : 'grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]'}>
          {isDashboard || chromeHidden ? null : <Sidebar items={navItems} />}
          <main className="app-layout-main min-w-0">
            <Outlet context={{ setChromeHidden }} />
            {chromeHidden ? null : <AppFooter />}
          </main>
        </div>
      </div>
      {chromeHidden ? null : <BottomNav items={navItems} />}
    </div>
  )
}

function PublicPredictionLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10211b,transparent_32%),linear-gradient(180deg,#07110d_0%,#0b1a14_50%,#07110d_100%)] text-slate-100">
      <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 lg:px-8">
        <main className="public-layout-main min-w-0">
          <UserPredictionPage />
          <AppFooter />
        </main>
      </div>
    </div>
  )
}

function LegalInfoLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#122033,transparent_34%),linear-gradient(180deg,#050c17_0%,#0a1525_52%,#050c17_100%)] text-slate-100">
      <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-8">
        <main className="public-layout-main min-w-0">
          <SiteInfoPage />
          <AppFooter />
        </main>
      </div>
    </div>
  )
}

export default function AppRouter() {
  return (
    <>
      <PointerTrail />
      <Routes>
        <Route path="/login" element={<PublicLoginPage />} />
        <Route path="/predictions/:userId" element={<PublicPredictionLayout />} />
        <Route path="/legal/:slug" element={<LegalInfoLayout />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardServicesPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/best-thirds" element={<BestThirdsPage />} />
            <Route path="/knockout" element={<KnockoutPage />} />
            <Route path="/scoreboard" element={<LeaderboardPage />} />
            <Route path="/leaderboard" element={<Navigate to="/scoreboard" replace />} />
            <Route path="/my-prediction" element={<MyPredictionPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<AppLayout />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
