function Register({ setScreen }) {
  return (
    <div className="container">
      <div className="card">
        <h2>Crear cuenta</h2>

        <form className="form">
          <input type="text" placeholder="Nombre" />
          <input type="email" placeholder="Correo electrónico" />
          <input type="password" placeholder="Contraseña" />
          <button type="submit">Registrarme</button>
        </form>

        <p className="link-text" onClick={() => setScreen('login')}>
          ¿Ya tienes cuenta? Inicia sesión
        </p>

        <p className="link-text" onClick={() => setScreen('home')}>
          Volver al inicio
        </p>
      </div>
    </div>
  )
}

export default Register