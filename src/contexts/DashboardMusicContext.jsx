import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

export const DASHBOARD_MUSIC_TRACKS = [
  { id: 'olha', label: 'Olha a Explosao', src: '/dashboard-audio/olha-a-explosao.mp3' },
  { id: 'agora', label: 'Agora e tudo meu', src: '/dashboard-audio/agora-e-tudo-meu.mp3' },
  { id: 'mas-que-nada', label: 'Mas Que Nada', src: '/dashboard-audio/mas-que-nada.mp3' },
  { id: 'magalenha', label: 'Magalenha', src: '/dashboard-audio/magalenha.mp3' },
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
  const audioRef = useRef(null)
  const [selectedTrackId, setSelectedTrackId] = useState(getRandomTrackId)
  const [musicPlaying, setMusicPlaying] = useState(false)

  const playTrack = useCallback(async (trackId = selectedTrackId) => {
    const audio = audioRef.current
    if (!audio) return false

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
  }, [selectedTrackId])

  const playNextTrack = useCallback((trackId = selectedTrackId) => {
    const nextTrackId = getNextTrackId(trackId)
    return playTrack(nextTrackId)
  }, [playTrack, selectedTrackId])

  const stopTrack = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    setMusicPlaying(false)
  }, [])

  const toggleMusic = useCallback(() => {
    if (musicPlaying) {
      stopTrack()
      return
    }

    void playTrack(selectedTrackId)
  }, [musicPlaying, playTrack, selectedTrackId, stopTrack])

  useEffect(() => {
    let isActive = true
    let removePendingStart = () => {}

    async function startInitialTrack() {
      const didStart = await playTrack(selectedTrackId)
      if (!isActive || didStart) return

      function startAfterGesture() {
        removePendingStart()
        void playTrack(selectedTrackId)
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
      const audio = audioRef.current
      if (audio) audio.pause()
    }
  }, [])

  const value = useMemo(
    () => ({
      tracks: DASHBOARD_MUSIC_TRACKS,
      selectedTrackId,
      musicPlaying,
      playTrack,
      playNextTrack,
      stopTrack,
      toggleMusic,
    }),
    [musicPlaying, playNextTrack, playTrack, selectedTrackId, stopTrack, toggleMusic],
  )

  return (
    <DashboardMusicContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={() => {
          void playNextTrack(selectedTrackId)
        }}
        onPlay={() => setMusicPlaying(true)}
        onPause={() => setMusicPlaying(false)}
      />
    </DashboardMusicContext.Provider>
  )
}
