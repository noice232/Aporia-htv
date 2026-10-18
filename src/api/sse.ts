import { useEventStore } from '../stores/events'

const BASE = import.meta.env.VITE_API_BASE_URL || ''
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]
const GAP_THRESHOLD = 50

let source: EventSource | null = null
let reconnectAttempt = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

export function connectSSE(projectId: string): void {
  disconnect()

  const store = useEventStore.getState()
  const cursor = store.cursor
  const url = `${BASE}/api/v1/projects/${projectId}/stream?after=${cursor}`

  source = new EventSource(url)
  store.setConnected(true)
  store.setError(null)
  reconnectAttempt = 0

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'heartbeat') return
      useEventStore.getState().appendEvents([data])
    } catch {
      // ignore malformed messages
    }
  }

  source.onerror = () => {
    useEventStore.getState().setConnected(false)
    source?.close()
    source = null
    scheduleReconnect(projectId)
  }

  source.addEventListener('gap', () => {
    const currentCursor = useEventStore.getState().cursor
    if (currentCursor > GAP_THRESHOLD) {
      useEventStore.getState().clear()
    }
    disconnect()
    connectSSE(projectId)
  })
}

function scheduleReconnect(projectId: string): void {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)]
  reconnectAttempt++

  reconnectTimer = setTimeout(() => {
    connectSSE(projectId)
  }, delay)
}

export function disconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (source) {
    source.close()
    source = null
  }
  useEventStore.getState().setConnected(false)
}
