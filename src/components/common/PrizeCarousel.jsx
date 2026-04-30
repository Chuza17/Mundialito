import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Crown, Gift, Trophy } from 'lucide-react'
import { formatPrizeAmount, getPrizeCards } from '../../utils/prizes'

const PRIZE_ICONS = {
  trophy: Trophy,
  crown: Crown,
  gift: Gift,
}

export default function PrizeCarousel({
  config,
  eyebrow = 'Premios',
  title = 'Top 3 del torneo',
  className = '',
  autoRotate = true,
  variant = 'carousel',
  showNotes = true,
}) {
  const prizes = useMemo(() => getPrizeCards(config), [config])
  const podiumPrizes = useMemo(() => [prizes[1], prizes[0], prizes[2]].filter(Boolean), [prizes])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (variant === 'podium' || !autoRotate || prizes.length <= 1) return undefined

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % prizes.length)
    }, 4600)

    return () => window.clearInterval(intervalId)
  }, [autoRotate, prizes.length, variant])

  function goToPrize(nextIndex) {
    const boundedIndex = (nextIndex + prizes.length) % prizes.length
    setActiveIndex(boundedIndex)
  }

  if (variant === 'podium') {
    return (
      <section className={`prize-carousel prize-podium ${className}`.trim()} aria-label={title || eyebrow}>
        <div className="prize-podium-head">
          <p className="prize-carousel-eyebrow">{eyebrow}</p>
          {title ? <h2 className="prize-carousel-title">{title}</h2> : null}
        </div>

        <div className="prize-podium-stage">
          {podiumPrizes.map((prize) => {
            const Icon = PRIZE_ICONS[prize.icon] ?? Trophy

            return (
              <article key={prize.key} className={`prize-podium-card ${prize.tone}`}>
                <div className="prize-podium-medal" aria-hidden="true">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="prize-podium-copy">
                  <span>{prize.label}</span>
                  <strong>{formatPrizeAmount(prize.amount)}</strong>
                  {showNotes ? <p>{prize.note}</p> : null}
                </div>

                <div className="prize-podium-step" aria-hidden="true">
                  <span>{prize.rank}</span>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <section className={`prize-carousel ${className}`.trim()} aria-label={title}>
      <div className="prize-carousel-head">
        <div className="prize-carousel-title-block">
          <p className="prize-carousel-eyebrow">{eyebrow}</p>
          <h2 className="prize-carousel-title">{title}</h2>
        </div>

        <div className="prize-carousel-controls" aria-label="Cambiar premio visible">
          <button type="button" onClick={() => goToPrize(activeIndex - 1)} aria-label="Ver premio anterior">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => goToPrize(activeIndex + 1)} aria-label="Ver siguiente premio">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="prize-carousel-window">
        <div className="prize-carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {prizes.map((prize) => {
            const Icon = PRIZE_ICONS[prize.icon] ?? Trophy

            return (
              <article key={prize.key} className={`prize-carousel-card ${prize.tone}`}>
                <div className="prize-carousel-rank">{prize.rank}</div>

                <div className="prize-carousel-icon" aria-hidden="true">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="prize-carousel-copy">
                  <span>{prize.label}</span>
                  <strong>{formatPrizeAmount(prize.amount)}</strong>
                  <p>{prize.note}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <div className="prize-carousel-dots" aria-label="Premios disponibles">
        {prizes.map((prize, index) => (
          <button
            key={prize.key}
            type="button"
            className={index === activeIndex ? 'is-active' : ''}
            onClick={() => goToPrize(index)}
            aria-label={`Ver ${prize.label}`}
            aria-pressed={index === activeIndex}
          />
        ))}
      </div>
    </section>
  )
}
