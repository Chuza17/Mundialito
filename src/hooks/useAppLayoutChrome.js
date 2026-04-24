import { useLayoutEffect } from 'react'
import { useOutletContext } from 'react-router-dom'

export function useAppLayoutChromeHidden(hidden) {
  const outletContext = useOutletContext()
  const setChromeHidden = outletContext?.setChromeHidden

  useLayoutEffect(() => {
    if (typeof setChromeHidden !== 'function') {
      return undefined
    }

    setChromeHidden(Boolean(hidden))

    return () => {
      setChromeHidden(false)
    }
  }, [hidden, setChromeHidden])
}
