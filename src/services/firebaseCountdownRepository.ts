import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import type {
  Countdown,
  CountdownInput,
  CountdownStatus,
  ThemeId,
} from '../domain/countdown'
import { normalizeGradientMood, THEMES } from '../domain/theme'
import type { CountdownRepository } from './countdownRepository'

export interface TimestampLike {
  toMillis(): number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isTimestamp = (value: unknown): value is TimestampLike =>
  isRecord(value) && typeof value.toMillis === 'function'

const isTheme = (value: unknown): value is ThemeId =>
  typeof value === 'string' && THEMES.some((theme) => theme.id === value)

const isStatus = (value: unknown): value is CountdownStatus =>
  value === 'active' || value === 'history'

export function countdownFromDocument(
  id: string,
  data: unknown,
): Countdown | null {
  if (!isRecord(data)) return null
  const settings = data.themeSettings

  if (
    typeof data.title !== 'string' ||
    !data.title.trim() ||
    data.title.length > 80 ||
    !isTimestamp(data.targetAt) ||
    !isStatus(data.status) ||
    !isTheme(data.theme) ||
    !isRecord(settings) ||
    typeof settings.gradientMood !== 'number' ||
    settings.gradientMood < 0 ||
    settings.gradientMood > 100 ||
    !isTimestamp(data.createdAt) ||
    !isTimestamp(data.updatedAt)
  ) {
    return null
  }

  return {
    id,
    title: data.title.trim(),
    targetAt: data.targetAt.toMillis(),
    status: data.status,
    theme: data.theme,
    themeSettings: {
      gradientMood: normalizeGradientMood(settings.gradientMood),
    },
    createdAt: data.createdAt.toMillis(),
    updatedAt: data.updatedAt.toMillis(),
  }
}

export function serializeCountdown(input: CountdownInput) {
  return {
    title: input.title.trim(),
    targetAt: input.targetAt,
    theme: input.theme,
    themeSettings: {
      gradientMood: normalizeGradientMood(input.themeSettings.gradientMood),
    },
  }
}

const countdownCollection = (db: Firestore, uid: string) =>
  collection(db, 'users', uid, 'countdowns')

export function createFirebaseCountdownRepository(
  db: Firestore,
): CountdownRepository {
  return {
    subscribe(uid, onData, onError) {
      return onSnapshot(
        countdownCollection(db, uid),
        (snapshot) => {
          const items = snapshot.docs.flatMap((snapshotDocument) => {
            const item = countdownFromDocument(
              snapshotDocument.id,
              snapshotDocument.data({ serverTimestamps: 'estimate' }),
            )
            if (!item) {
              console.warn(
                `Skipped malformed countdown document ${snapshotDocument.id}.`,
              )
              return []
            }
            return [item]
          })
          onData(items)
        },
        (error) => onError(error),
      )
    },

    async create(uid, input) {
      const reference = doc(countdownCollection(db, uid))
      const value = serializeCountdown(input)
      await setDoc(reference, {
        ...value,
        targetAt: Timestamp.fromMillis(value.targetAt),
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return reference.id
    },

    async update(uid, id, input) {
      const value = serializeCountdown(input)
      await updateDoc(doc(countdownCollection(db, uid), id), {
        ...value,
        targetAt: Timestamp.fromMillis(value.targetAt),
        status: 'active',
        updatedAt: serverTimestamp(),
      })
    },

    async remove(uid, id) {
      await deleteDoc(doc(countdownCollection(db, uid), id))
    },

    async archiveExpired(uid, ids) {
      if (ids.length === 0) return
      const batch = writeBatch(db)
      for (const id of ids) {
        batch.update(doc(countdownCollection(db, uid), id), {
          status: 'history',
          updatedAt: serverTimestamp(),
        })
      }
      await batch.commit()
    },
  }
}
