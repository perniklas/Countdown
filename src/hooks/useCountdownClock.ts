import { useEffect, useRef, useState } from 'react'
import { getTimeParts, type TimeParts } from '../domain/countdown'

export function useCountdownClock(
  targetAt: number,
  onReachZero?: () => void,
): TimeParts {
  const [clock, setClock] = useState(() => ({
    targetAt,
    parts: getTimeParts(targetAt),
  }))
  const parts =
    clock.targetAt === targetAt ? clock.parts : getTimeParts(targetAt)
  const callbackRef = useRef(onReachZero)
  const observedPositiveRef = useRef(!parts.isComplete)
  const notifiedRef = useRef(false)

  useEffect(() => {
    callbackRef.current = onReachZero
  }, [onReachZero])

  useEffect(() => {
    const initial = getTimeParts(targetAt)
    observedPositiveRef.current = !initial.isComplete
    notifiedRef.current = false

    const tick = () => {
      const next = getTimeParts(targetAt)
      setClock({ targetAt, parts: next })

      if (!next.isComplete) {
        observedPositiveRef.current = true
        return
      }

      if (observedPositiveRef.current && !notifiedRef.current) {
        notifiedRef.current = true
        callbackRef.current?.()
      }
    }

    const timer = window.setInterval(tick, 250)
    return () => window.clearInterval(timer)
  }, [targetAt])

  return parts
}
