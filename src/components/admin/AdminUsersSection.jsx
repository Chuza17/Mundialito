import CreateUserForm from './CreateUserForm'
import UsersList from './UsersList'

export default function AdminUsersSection({
  loading,
  users,
  usersError,
  onCreate,
  onReset,
  onDelete,
}) {
  return (
    <div className="admin-hub-grid admin-hub-grid-users">
      <article className="admin-hub-card">
        <div className="admin-hub-card-head">
          <div>
            <p className="admin-hub-eyebrow">Alta directa</p>
            <h3 className="admin-hub-card-title">Crear usuario en Supabase</h3>
          </div>
          <span className="admin-hub-badge">Edge Function</span>
        </div>
        <p className="admin-hub-card-copy">
          Este flujo crea el usuario en auth y deja el perfil listo para login dentro de la plataforma.
        </p>
        <div className="mt-6">
          <CreateUserForm onCreate={onCreate} loading={loading} />
        </div>
      </article>

      <article className="admin-hub-card">
        <div className="admin-hub-card-head">
          <div>
            <p className="admin-hub-eyebrow">Base activa</p>
            <h3 className="admin-hub-card-title">Cuentas creadas</h3>
          </div>
          <span className="admin-hub-badge">{users.length} perfiles</span>
        </div>
        <p className="admin-hub-card-copy">
          Aqui se muestran las cuentas registradas. Puedes resetear contrasenas o eliminar acceso si un usuario no paga o no cumple con los requisitos.
        </p>

        {usersError ? <p className="admin-hub-error mt-5">{usersError}</p> : null}
        {loading ? <p className="admin-hub-empty mt-5">Cargando usuarios desde Supabase...</p> : null}
        {!loading && !users.length ? <p className="admin-hub-empty mt-5">Todavia no hay usuarios cargados.</p> : null}
        {!loading && users.length ? (
          <div className="mt-5">
            <UsersList users={users} onReset={onReset} onDelete={onDelete} />
          </div>
        ) : null}
      </article>
    </div>
  )
}
