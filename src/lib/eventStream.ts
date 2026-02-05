import type { LiveOpsEvent, LiveOpsEventHandler } from './liveOpsTypes'
import { connectMockEventStream } from './mockEvents'

const EVENT_TYPES: LiveOpsEvent['type'][] = [
  'call_started',
  'transcript_appended',
  'call_status',
  'recording_ready'
]

export function connectEventStream(handler: LiveOpsEventHandler) {
  const useMock = import.meta.env.VITE_USE_MOCK_SSE !== 'false'
  if (useMock) {
    return connectMockEventStream(handler)
  }

  const baseUrl = import.meta.env.VITE_API_URL ?? ''
  const url = `${baseUrl}/public/events?since=0`
  const source = new EventSource(url)

  const handleMessage = (message: MessageEvent) => {
    if (!message?.data) return
    try {
      const parsed = JSON.parse(message.data)
      if (parsed?.type) {
        handler(parsed as LiveOpsEvent)
      }
    } catch (error) {
      console.warn('Unable to parse SSE payload', error)
    }
  }

  source.onmessage = handleMessage
  EVENT_TYPES.forEach((eventType) => {
    source.addEventListener(eventType, handleMessage)
  })

  return {
    close() {
      source.close()
    }
  }
}
