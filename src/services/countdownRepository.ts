import type { Countdown, CountdownInput } from '../domain/countdown'

export interface CountdownRepository {
  subscribe(
    uid: string,
    onData: (items: Countdown[]) => void,
    onError: (error: Error) => void,
  ): () => void
  create(uid: string, input: CountdownInput): Promise<string>
  update(uid: string, id: string, input: CountdownInput): Promise<void>
  remove(uid: string, id: string): Promise<void>
  archiveExpired(uid: string, ids: string[]): Promise<void>
}
