import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { publicAsset } from '../utils/publicAsset'

export const DASHBOARD_MUSIC_TRACKS = [
  { id: 'olha', label: 'Olha a Explosao', src: publicAsset('/dashboard-audio/olha-a-explosao.mp3') },
  { id: 'agora', label: 'Agora e tudo meu', src: publicAsset('/dashboard-audio/agora-e-tudo-meu.mp3') },
  { id: 'mas-que-nada', label: 'Mas Que Nada', src: publicAsset('/dashboard-audio/mas-que-nada.mp3') },
  { id: 'magalenha', label: 'Magalenha', src: publicAsset('/dashboard-audio/magalenha.mp3') },
]

export const DashboardMusicContext = createContext(null)

function getRandomTrackId() {
  return DASHBOARD_MUSIC_TRACKS[Math.floor(Math.random() * DASHBOARD_MUSIC_TRACKS.length)]?.id ?? DASHBOARD_MUSIC_TRACKS[0].id
}

function getTrackById(trackId) {
  return DASHBOARD_MUSIC_TRACKS.find((track) => track.id === trackId) ?? DASHBOARD_MUSIC_TRACKS[0]
}

function getNextTrackId(trackId) {
  const currentIndex = DASHBOARD_MUSIC_TRACKS.findIndex((track) => track.id === trackId)
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % DASHBOARD_MUSIC_TRACKS.length : 0
  return DASHBOARD_MUSIC_TRACKS[nextIndex].id
}

export function DashboardMusicProvider({ children }) {
  const { loading, user } = useAuth()
  const audioRef = useRef(null)
  const initialStartedForUserRef = useRef(null)
  const [selectedTrackId, setSelectedTrackId] = useState(getRandomTrackId)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const musicAllowed = Boolean(user?.id) && !loading

  const stopTrack = useCallback((resetSource = false) => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    if (resetSource) {
      audio.removeAttribute('src')
      audio.load()
    }
    setMusicPlaying(false)
  }, [])

  const playTrack = useCallback(async (trackId = selectedTrackId) => {
    const audio = audioRef.current
    if (!audio) return false

    if (!musicAllowed) {
      stopTrack(true)
      return false
    }

    const track = getTrackById(trackId)
    setSelectedTrackId(track.id)
    audio.src = track.src
    audio.loop = false
    audio.volume = 0.42

    try {
      await audio.play()
      setMusicPlaying(true)
      return true
    } catch {
      audio.pause()
      setMusicPlaying(false)
      return false
    }
  }, [musicAllowed, selectedTrackId, stopTrack])

  const playNextTrack = useCallback((trackId = selectedTrackId) => {
    if (!musicAllowed) {
      stopTrack(true)
      return false
    }

    const nextTrackId = getNextTrackId(trackId)
    return playTrack(nextTrackId)
  }, [musicAllowed, playTrack, selectedTrackId, stopTrack])

  const toggleMusic = useCallback(() => {
    if (!musicAllowed) {
      stopTrack(true)
      return
    }

    if (musicPlaying) {
      stopTrack()
      return
    }

    void playTrack(selectedTrackId)
  }, [musicAllowed, musicPlaying, playTrack, selectedTrackId, stopTrack])

  useEffect(() => {
    let isActive = true
    let removePendingStart = () => {}

    if (!musicAllowed || !user?.id) {
      initialStartedForUserRef.current = null
      stopTrack(true)
      return undefined
    }

    if (initialStartedForUserRef.current === user.id) {
      return undefined
    }

    initialStartedForUserRef.current = user.id

    async function startInitialTrack() {
      const initialTrackId = getRandomTrackId()
      const didStart = await playTrack(initialTrackId)
      if (!isActive || didStart) return

      function startAfterGesture() {
        removePendingStart()
        void playTrack(initialTrackId)
      }

      removePendingStart = () => {
        window.removeEventListener('pointerdown', startAfterGesture)
        window.removeEventListener('keydown', startAfterGesture)
      }

      window.addEventListener('pointerdown', startAfterGesture, { once: true })
      window.addEventListener('keydown', startAfterGesture, { once: true })
    }

    void startInitialTrack()

    return () => {
      isActive = false
      removePendingStart()
    }
  }, [musicAllowed, playTrack, stopTrack, user?.id])

  const value = useMemo(
    () => ({
      tracks: DASHBOARD_MUSIC_TRACKS,
      musicAllowed,
      selectedTrackId,
      musicPlaying,
      playTrack,
      playNextTrack,
      stopTrack,
      toggleMusic,
    }),
    [musicAllowed, musicPlaying, playNextTrack, playTrack, selectedTrackId, stopTrack, toggleMusic],
  )

  return (
    <DashboardMusicContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={() => {
          if (musicAllowed) void playNextTrack(selectedTrackId)
        }}
        onPlay={() => setMusicPlaying(true)}
        onPause={() => setMusicPlaying(false)}
      />
    </DashboardMusicContext.Provider>
  )
}
