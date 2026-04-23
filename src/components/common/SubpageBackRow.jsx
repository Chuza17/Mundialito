import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SubpageBackRow({ label = 'Volver al menu', to = '/dashboard' }) {
  return (
    <div className="subpage-back-row">
      <Link to={to} className="button-secondary groups-back-button subpage-back-button">
        <ArrowLeft className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    </div>
  )
}
