import { CalendarDays, Edit3 } from 'lucide-react'
import type { Countdown } from '../domain/countdown'
import { useCountdownClock } from '../hooks/useCountdownClock'

interface HeroCountdownProps {
  countdown: Countdown
  onEdit: () => void
  onReachZero?: () => void
}

const targetFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const twoDigits = (value: number) => value.toString().padStart(2, '0')

export function HeroCountdown({
  countdown,
  onEdit,
  onReachZero,
}: HeroCountdownProps) {
  const time = useCountdownClock(countdown.targetAt, onReachZero)
  const units = [
    { value: time.days, label: 'days' },
    { value: time.hours, label: 'hours' },
    { value: time.minutes, label: 'minutes' },
    { value: time.seconds, label: 'seconds' },
  ]

  return (
    <section className="hero-countdown" aria-labelledby="countdown-title">
      <p className="countdown-kicker">
        {countdown.status === 'history'
          ? 'A moment to remember'
          : time.isComplete
            ? 'The moment is here'
            : 'Counting down to'}
      </p>
      <h1 id="countdown-title">{countdown.title}</h1>
      <div className="time-grid" aria-label={`Time remaining until ${countdown.title}`}>
        {units.map((unit) => (
          <div className="time-unit" key={unit.label}>
            <span className="time-value" aria-hidden="true">
              {unit.label === 'days' ? unit.value : twoDigits(unit.value)}
            </span>
            <span className="time-label">{unit.label}</span>
          </div>
        ))}
      </div>
      <div className="target-date">
        <CalendarDays size={17} aria-hidden="true" />
        <time dateTime={new Date(countdown.targetAt).toISOString()}>
          {targetFormatter.format(countdown.targetAt)}
        </time>
      </div>
      <button className="text-button hero-edit" type="button" onClick={onEdit}>
        <Edit3 size={16} aria-hidden="true" />
        Edit countdown
      </button>
    </section>
  )
}
