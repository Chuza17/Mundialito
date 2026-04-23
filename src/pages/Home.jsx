function Home({ setScreen }) {
  return (
    <div className="container">
      <div className="card">
        <h1>El Mundialito</h1>
        <p>
          Predice cómo quedarán los grupos del Mundial y compite con tu familia y amigos.
        </p>

        <div className="button-group">
          <button onClick={() => setScreen('login')}>Iniciar sesión</button>
          <button onClick={() => setScreen('register')}>Crear cuenta</button>
          <button onClick={() => setScreen('dashboard')}>Ver demo</button>
        </div>
      </div>
    </div>
  )
}

export default Home