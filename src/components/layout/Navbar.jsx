import logoutButtonImage from '../../assets/branding/logout-button.png'

export default function Navbar({ isCinematic = false, onLogout }) {
  return (
    <div className={`dashboard-logout-wrap${isCinematic ? ' is-cinematic' : ''}`}>
      <button type="button" onClick={onLogout} className="dashboard-logout-button">
        <img src={logoutButtonImage} alt="" aria-hidden="true" />
        <span className="sr-only">Salir</span>
      </button>
    </div>
  )
}
