import { useEffect, useState } from 'react'
import { formatCountdown } from '../../utils/helpers'

export default function CountdownTimer({ deadline }) {
  const [text, setText] = useState(() => formatCountdown(deadline))

  useEffect(() => {
    const timer = window.setInterval(() => setText(formatCountdown(deadline)), 60000)
    return () => window.clearInterval(timer)
  }, [deadline])

  return <span className="pill">{text}</span>
}
