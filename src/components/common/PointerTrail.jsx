import { useEffect, useRef, useState } from 'react'

const TRAIL_DURATION = 2000
const TRAIL_INTERVAL = 18
const MIN_DISTANCE = 4
export const POINTER_TRAIL_STORAGE_KEY = 'mundialito-neon-enabled'
export const POINTER_TRAIL_TOGGLE_EVENT = 'mundialito-neon-toggle'

function getStoredTrailPreference() {
  try {
    return localStorage.getItem(POINTER_TRAIL_STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

export default function PointerTrail() {
  const layerRef = useRef(null)
  const [enabled, setEnabled] = useState(getStoredTrailPreference)

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return undefined

    function handleToggle(event) {
      setEnabled(Boolean(event.detail?.enabled))
    }

    function handleStorage(event) {
      if (event.key === POINTER_TRAIL_STORAGE_KEY) {
        setEnabled(event.newValue !== '0')
      }
    }

    window.addEventListener(POINTER_TRAIL_TOGGLE_EVENT, handleToggle)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(POINTER_TRAIL_TOGGLE_EVENT, handleToggle)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return undefined

    if (!enabled) {
      layer.replaceChildren()
      return undefined
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return undefined

    const timeoutIds = new Set()
    let lastTime = 0
    let lastX = null
    let lastY = null

    function removeNode(node, timeoutId) {
      node.remove()
      timeoutIds.delete(timeoutId)
    }

    function handlePointerMove(event) {
      if (event.pointerType === 'touch') return

      const now = performance.now()
      const deltaX = lastX === null ? Number.POSITIVE_INFINITY : event.clientX - lastX
      const deltaY = lastY === null ? Number.POSITIVE_INFINITY : event.clientY - lastY

      if (now - lastTime < TRAIL_INTERVAL && Math.hypot(deltaX, deltaY) < MIN_DISTANCE) {
        return
      }

      lastTime = now
      lastX = event.clientX
      lastY = event.clientY

      const dot = document.createElement('span')
      const size = 10 + Math.min(14, Math.hypot(deltaX, deltaY) * 0.32)
      dot.className = 'pointer-trail-dot'
      dot.style.setProperty('--trail-x', `${event.clientX}px`)
      dot.style.setProperty('--trail-y', `${event.clientY}px`)
      dot.style.setProperty('--trail-size', `${Number.isFinite(size) ? size : 12}px`)
      layer.appendChild(dot)

      const timeoutId = window.setTimeout(() => removeNode(dot, timeoutId), TRAIL_DURATION)
      timeoutIds.add(timeoutId)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
      timeoutIds.clear()
      layer.replaceChildren()
    }
  }, [enabled])

  return <div ref={layerRef} className="pointer-trail-layer" aria-hidden="true" />
}
