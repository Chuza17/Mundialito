import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminBackupSection from '../components/admin/AdminBackupSection'
import AdminPrizesSection from '../components/admin/AdminPrizesSection'
import AdminSettingsSection from '../components/admin/AdminSettingsSection'
import AdminUsersSection from '../components/admin/AdminUsersSection'
import Toast from '../components/common/Toast'
import adminPanelBanner from '../assets/branding/admin_panel_banner.svg'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useAppConfig } from '../hooks/useAppConfig'
import { useTeams } from '../hooks/useTeams'
import { groupTeamsByLetter, validateGroupTable } from '../utils/helpers'
import { formatPrizeAmount, getPrizePool } from '../utils/prizes'

const ADMIN_SECTIONS = [
  { id: 'users', label: 'Usuarios', copy: 'Alta directa, control y soporte de cuentas.' },
  { id: 'prizes', label: 'Premios', copy: 'Podio visible en login, dashboard y scoreboard.' },
  { id: 'settings', label: 'Configuracion', copy: 'Cierre, bloqueo y ajustes operativos.' },
  { id: 'backup', label: 'Respaldo API', copy: 'Editor manual por si el feed externo falla.' },
]

const MANUAL_GROUPS_STORAGE_KEY = 'admin-manual-groups-backup-v1'

function readManualDrafts() {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(MANUAL_GROUPS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function serializeManualDrafts(drafts = {}) {
  return Object.fromEntries(
    Object.entries(drafts).map(([letter, rows]) => [
      letter,
      (rows ?? []).map((row) => ({
        ...row,
        predicted_position: Number(row.predicted_position ?? 4),
        predicted_points: Number(row.predicted_points ?? 0),
      })),
    ])
  )
}

function buildManualDrafts(teamsByGroup = {}, savedDrafts = {}) {
  return Object.keys(teamsByGroup).reduce((accumulator, letter) => {
    const savedRows = Array.isArray(savedDrafts[letter]) ? savedDrafts[letter] : []

    accumulator[letter] = (teamsByGroup[letter] ?? [])
      .map((team, index) => {
        const savedRow = savedRows.find((row) => row.team_id === team.id || row.code === team.code)

        return {
          team_id: team.id,
          code: team.code,
          name: team.name,
          group_letter: letter,
          predicted_position: Number(savedRow?.predicted_position ?? index + 1),
          predicted_points: Number(savedRow?.predicted_points ?? Math.max(0, 3 - index)),
        }
      })
      .sort((left, right) => left.predicted_position - right.predicted_position)

    return accumulator
  }, {})
}

export default function AdminUsersPage() {
  const { users, loading, error: usersError, createUser, deleteUser, resetPassword } = useAdminUsers()
  const { config, saving, updateConfig } = useAppConfig()
  const { teams, loading: teamsLoading, error: teamsError } = useTeams()
  const [activeSection, setActiveSection] = useState('users')
  const [toast, setToast] = useState(null)
  const [activeManualGroup, setActiveManualGroup] = useState('A')
  const [manualDrafts, setManualDrafts] = useState({})
  const [configDraft, setConfigDraft] = useState({
    deadline: '',
    predictions_locked: false,
    first_place_prize: 0,
    second_place_prize: 0,
    third_place_prize: 0,
  })

  const teamsByGroup = groupTeamsByLetter(teams)
  const defaultManualDrafts = buildManualDrafts(teamsByGroup)
  const visibleUsers = users.filter((user) => user.role !== 'admin')
  const activeUsers = visibleUsers.filter((user) => user.is_active !== false)
  const prizePool = getPrizePool(configDraft)
  const manualReadyCount = Object.keys(manualDrafts).filter((letter) => validateGroupTable(manualDrafts[letter]).valid).length

  useEffect(() => {
    setConfigDraft({
      deadline: config?.deadline ?? '',
      predictions_locked: config?.predictions_locked ?? false,
      first_place_prize: Number(config?.first_place_prize ?? 0),
      second_place_prize: Number(config?.second_place_prize ?? 0),
      third_place_prize: Number(config?.third_place_prize ?? 0),
    })
  }, [config])

  useEffect(() => {
    const nextDrafts = buildManualDrafts(teamsByGroup, readManualDrafts())
    const nextLetters = Object.keys(nextDrafts).filter((letter) => (nextDrafts[letter] ?? []).length)
    setManualDrafts(nextDrafts)
    if (nextLetters.length && !nextLetters.includes(activeManualGroup)) setActiveManualGroup(nextLetters[0])
  }, [teams])

  async function handleCreateUser(payload) {
    try {
      await createUser(payload)
      setToast({ type: 'success', message: 'Usuario creado correctamente en Supabase.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'No se pudo crear el usuario.' })
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Deseas desactivar a ${user.display_name}?`)) return
    try {
      await deleteUser(user.id)
      setToast({ type: 'success', message: 'Usuario desactivado.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'No se pudo desactivar el usuario.' })
    }
  }

  async function handleReset(user) {
    const password = window.prompt(`Nueva contrasena temporal para ${user.display_name}:`)
    if (!password) return
    try {
      await resetPassword({ userId: user.id, password })
      setToast({ type: 'success', message: 'Contrasena reseteada por Edge Function.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'No se pudo resetear la contrasena.' })
    }
  }

  async function handleSavePrizes(event) {
    event.preventDefault()
    try {
      await updateConfig({
        first_place_prize: Number(configDraft.first_place_prize || 0),
        second_place_prize: Number(configDraft.second_place_prize || 0),
        third_place_prize: Number(configDraft.third_place_prize || 0),
      })
      setToast({ type: 'success', message: 'Premios actualizados.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'No se pudieron actualizar los premios.' })
    }
  }

  async function handleSaveSettings(event) {
    event.preventDefault()
    try {
      await updateConfig({ deadline: configDraft.deadline, predictions_locked: configDraft.predictions_locked })
      setToast({ type: 'success', message: 'Configuracion global actualizada.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'No se pudo actualizar la configuracion.' })
    }
  }

  function handleConfigChange(field, value) {
    setConfigDraft((current) => ({ ...current, [field]: value }))
  }

  function handleManualFieldChange(teamId, field, value) {
    setManualDrafts((current) => ({
      ...current,
      [activeManualGroup]: [...(current[activeManualGroup] ?? [])]
        .map((row) => (row.team_id === teamId ? { ...row, [field]: Number(value) } : row))
        .sort((left, right) => left.predicted_position - right.predicted_position),
    }))
  }

  function handleSaveManualBackup() {
    window.localStorage.setItem(MANUAL_GROUPS_STORAGE_KEY, JSON.stringify(serializeManualDrafts(manualDrafts)))
    setToast({ type: 'success', message: 'Respaldo manual guardado en este navegador.' })
  }

  async function handleCopyManualBackup() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(serializeManualDrafts(manualDrafts), null, 2))
      setToast({ type: 'success', message: 'JSON del respaldo copiado al portapapeles.' })
    } catch {
      setToast({ type: 'error', message: 'No se pudo copiar el respaldo.' })
    }
  }

  function renderSection() {
    if (activeSection === 'users') {
      return (
        <AdminUsersSection
          loading={loading}
          users={visibleUsers}
          usersError={usersError}
          onCreate={handleCreateUser}
          onReset={handleReset}
          onDelete={handleDelete}
        />
      )
    }

    if (activeSection === 'prizes') {
      return <AdminPrizesSection saving={saving} draft={configDraft} onChange={handleConfigChange} onSave={handleSavePrizes} />
    }

    if (activeSection === 'settings') {
      return <AdminSettingsSection saving={saving} draft={configDraft} onChange={handleConfigChange} onSave={handleSaveSettings} />
    }

    return (
      <AdminBackupSection
        teamsLoading={teamsLoading}
        teamsError={teamsError}
        teamsByGroup={teamsByGroup}
        manualDrafts={manualDrafts}
        activeGroup={activeManualGroup}
        onSelectGroup={setActiveManualGroup}
        onFieldChange={handleManualFieldChange}
        onSaveLocal={handleSaveManualBackup}
        onCopyJson={handleCopyManualBackup}
        onResetGroup={() => setManualDrafts((current) => ({ ...current, [activeManualGroup]: defaultManualDrafts[activeManualGroup] ?? [] }))}
      />
    )
  }

  return (
    <section className="admin-hub space-y-6">
      <div
        className="admin-hub-hero glass-panel"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(24, 10, 14, 0.92) 0%, rgba(52, 12, 23, 0.84) 46%, rgba(120, 23, 45, 0.35) 100%), url(${adminPanelBanner})`,
        }}
      >
        <div className="admin-hub-hero-topbar">
          <Link to="/dashboard" className="admin-hub-back-button">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al menu</span>
          </Link>
        </div>
        <div className="admin-hub-hero-inner">
          <div className="admin-hub-hero-copy">
            <p className="admin-hub-kicker">Panel maestro</p>
            <h2 className="admin-hub-hero-title">Centro de control administrativo</h2>
            <p className="admin-hub-hero-text">
              Organiza usuarios, premios, configuracion global y un respaldo manual para grupos desde una sola interfaz.
            </p>
          </div>

          <div className="admin-hub-metrics">
            <article className="admin-hub-metric">
              <span>Usuarios activos</span>
              <strong>{activeUsers.length}</strong>
              <small>{visibleUsers.length} perfiles visibles</small>
            </article>
            <article className="admin-hub-metric">
              <span>Premios</span>
              <strong>{formatPrizeAmount(prizePool)}</strong>
              <small>Primer + segundo + tercer lugar</small>
            </article>
            <article className="admin-hub-metric">
              <span>Modulo activo</span>
              <strong>{ADMIN_SECTIONS.find((section) => section.id === activeSection)?.label}</strong>
              <small>{ADMIN_SECTIONS.find((section) => section.id === activeSection)?.copy}</small>
            </article>
            <article className="admin-hub-metric">
              <span>Respaldo grupos</span>
              <strong>{manualReadyCount}/12</strong>
              <small>Listos para contingencia</small>
            </article>
          </div>
        </div>
      </div>

      <div className="admin-hub-nav">
        {ADMIN_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`admin-hub-nav-button${activeSection === section.id ? ' is-active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span>{section.label}</span>
            <small>{section.copy}</small>
          </button>
        ))}
      </div>

      <div className="admin-hub-section-shell">{renderSection()}</div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </section>
  )
}
