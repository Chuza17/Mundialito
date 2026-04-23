function Login({ setScreen }) {
  return (
    <div className="container">
      <div className="card">
        <h2>Iniciar sesión</h2>

        <form className="form">
          <input type="email" placeholder="Correo electrónico" />
          <input type="password" placeholder="Contraseña" />
          <button type="submit">Entrar</button>
        </form>

        <p className="link-text" onClick={() => setScreen('register')}>
          ¿No tienes cuenta? Regístrate
        </p>

        <p className="link-text" onClick={() => setScreen('home')}>
          Volver al inicio
        </p>
      </div>
    </div>
  )
}

export default Login