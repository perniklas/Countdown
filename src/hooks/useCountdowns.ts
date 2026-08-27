import { useCallback, useEffect, useState } from 'react'
import type { Countdown, CountdownInput } from '../domain/countdown'
import type { CountdownRepository } from '../services/countdownRepository'

const asError = (value: unknown): Error =>
  value instanceof Error ? value : new Error('Something went wrong.')

export function useCountdowns(
  uid: string,
  repository: CountdownRepository,
) {
  const [items, setItems] = useState<Countdown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let migratedInitialSnapshot = false

    return repository.subscribe(
      uid,
      (nextItems) => {
        setItems(nextItems)
        setLoading(false)
        setError(null)

        if (migratedInitialSnapshot) return
        migratedInitialSnapshot = true
        const now = Date.now()
        const expiredIds = nextItems
          .filter(
            (item) => item.status === 'active' && item.targetAt <= now,
          )
          .map((item) => item.id)

        void repository.archiveExpired(uid, expiredIds).catch((value) => {
          setError(asError(value))
        })
      },
      (value) => {
        setLoading(false)
        setError(asError(value))
      },
    )
  }, [repository, uid])

  const run = useCallback(
    async <Result,>(operation: () => Promise<Result>): Promise<Result> => {
      setError(null)
      try {
        return await operation()
      } catch (value) {
        const nextError = asError(value)
        setError(nextError)
        throw nextError
      }
    },
    [],
  )

  const create = useCallback(
    (input: CountdownInput) => run(() => repository.create(uid, input)),
    [repository, run, uid],
  )

  const update = useCallback(
    (id: string, input: CountdownInput) =>
      run(() => repository.update(uid, id, input)),
    [repository, run, uid],
  )

  const remove = useCallback(
    (id: string) => run(() => repository.remove(uid, id)),
    [repository, run, uid],
  )

  return {
    items,
    loading,
    error,
    create,
    update,
    remove,
    clearError: () => setError(null),
  }
}
