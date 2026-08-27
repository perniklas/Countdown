import type { Countdown, CountdownInput } from '../domain/countdown'
import type { CountdownRepository } from '../services/countdownRepository'

export class FakeCountdownRepository implements CountdownRepository {
  private listeners = new Set<(items: Countdown[]) => void>()
  private sequence = 0
  items: Countdown[]
  createError: Error | null = null

  constructor(items: Countdown[] = []) {
    this.items = [...items]
  }

  subscribe(
    _uid: string,
    onData: (items: Countdown[]) => void,
  ) {
    this.listeners.add(onData)
    queueMicrotask(() => onData([...this.items]))
    return () => this.listeners.delete(onData)
  }

  async create(_uid: string, input: CountdownInput): Promise<string> {
    if (this.createError) throw this.createError
    const id = `created-${++this.sequence}`
    this.items.push({
      id,
      ...input,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    this.emit()
    return id
  }

  async update(
    _uid: string,
    id: string,
    input: CountdownInput,
  ): Promise<void> {
    this.items = this.items.map((item) =>
      item.id === id
        ? { ...item, ...input, status: 'active', updatedAt: Date.now() }
        : item,
    )
    this.emit()
  }

  async remove(_uid: string, id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
    this.emit()
  }

  async archiveExpired(_uid: string, ids: string[]): Promise<void> {
    const idSet = new Set(ids)
    this.items = this.items.map((item) =>
      idSet.has(item.id) ? { ...item, status: 'history' } : item,
    )
    if (ids.length > 0) this.emit()
  }

  emit() {
    for (const listener of this.listeners) listener([...this.items])
  }
}
