import { AtSign, KeyRound, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'

const ADMIN_CREATE_FIELDS = [
  {
    key: 'email',
    label: 'Email',
    placeholder: 'correo@ejemplo.com',
    type: 'email',
    icon: Mail,
  },
  {
    key: 'username',
    label: 'Usuario',
    placeholder: 'usuario',
    type: 'text',
    icon: AtSign,
  },
  {
    key: 'displayName',
    label: 'Nombre a mostrar',
    placeholder: 'Nombre del participante',
    type: 'text',
    icon: UserRound,
  },
  {
    key: 'password',
    label: 'Contrasena temporal',
    placeholder: 'Minimo 6 caracteres',
    type: 'password',
    icon: KeyRound,
  },
]

export default function CreateUserForm({ onCreate, loading }) {
  const [form, setForm] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
  })

  async function handleSubmit(event) {
    event.preventDefault()
    await onCreate(form)
    setForm({ email: '', username: '', displayName: '', password: '' })
  }

  return (
    <div className="admin-create-shell">
      <div className="admin-create-auth-card">
        <div className="admin-create-auth-head">
          <h4 className="admin-create-auth-title">Crear usuario</h4>
          <p className="admin-create-auth-copy">Alta manual lista para Supabase</p>
        </div>

        <form className="admin-create-auth-form" onSubmit={handleSubmit}>
          {ADMIN_CREATE_FIELDS.map((field) => {
            const Icon = field.icon

            return (
              <label key={field.key} className="admin-create-auth-field">
                <span>{field.label}</span>
                <div className="admin-create-auth-input">
                  <input
                    type={field.type}
                    value={form[field.key]}
                    placeholder={field.placeholder}
                    onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  />
                  <Icon className="h-4 w-4" />
                </div>
              </label>
            )
          })}

          <button type="submit" disabled={loading} className="admin-create-submit-button">
            {loading ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      </div>
    </div>
  )
}
