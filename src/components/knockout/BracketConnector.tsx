import { useMemo } from 'react'

type ConnectorPath = {
  active: boolean
  d: string
  id: string
  isFinalPath: boolean
}

type BracketConnectorProps = {
  bodyHeight: number
  paths: ConnectorPath[]
  width: number
}

export default function BracketConnector({ bodyHeight, paths, width }: BracketConnectorProps) {
  const activePaths = useMemo(() => paths.filter((path) => path.active), [paths])
  const mutedPaths = useMemo(() => paths.filter((path) => !path.active), [paths])

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-visible"
      viewBox={`0 0 ${width} ${bodyHeight}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="bracket-connector-glow" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(125,180,255,0.08)" />
          <stop offset="50%" stopColor="rgba(125,180,255,0.28)" />
          <stop offset="100%" stopColor="rgba(255,226,122,0.18)" />
        </linearGradient>
        <linearGradient id="bracket-connector-active" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="#7db4ff" />
          <stop offset="55%" stopColor="#80d6a4" />
          <stop offset="100%" stopColor="#ffe27a" />
        </linearGradient>
      </defs>

      {mutedPaths.map((path) => (
        <path
          key={`${path.id}-muted-glow`}
          d={path.d}
          fill="none"
          stroke="url(#bracket-connector-glow)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={path.isFinalPath ? 12 : 9}
        />
      ))}

      {mutedPaths.map((path) => (
        <path
          key={`${path.id}-muted`}
          d={path.d}
          fill="none"
          stroke="rgba(148, 163, 184, 0.20)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={path.isFinalPath ? 3.2 : 2.4}
        />
      ))}

      {activePaths.map((path) => (
        <path
          key={`${path.id}-active-glow`}
          d={path.d}
          fill="none"
          stroke="rgba(125, 180, 255, 0.24)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={path.isFinalPath ? 11 : 8}
        />
      ))}

      {activePaths.map((path) => (
        <path
          key={`${path.id}-active`}
          d={path.d}
          fill="none"
          stroke="url(#bracket-connector-active)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={path.isFinalPath ? 3.6 : 2.8}
        />
      ))}
    </svg>
  )
}
