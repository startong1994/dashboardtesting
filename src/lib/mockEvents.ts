import type { LiveOpsEventHandler, LiveOpsEvent } from './liveOpsTypes'

const samplePhones = ['+12125550199', '+14155552671', '+17185551234', '+12135557890']
const customerLines = [
  'hi i want general tso chicken',
  'can i get two spicy ramen and a miso soup',
  'is the orange tofu available?',
  'add extra chili oil to the order please',
  'what is the wait time for pickup?',
  'can you make it gluten free?'
]
const assistantLines = [
  'Absolutely. Would you like that as a combo?',
  'Got it. Any modifications for the spicy ramen?',
  'Orange tofu is available today.',
  'Noted. Extra chili oil added.',
  'Pickup is about 20 minutes right now.',
  'We can do gluten free for that item.'
]

type MockCall = {
  callId: string
  phoneE164: string
  status: 'active' | 'watch' | 'blocked' | 'ended'
  lastSpeaker: 'customer' | 'assistant'
  startedAt: number
}

const recordingLinks = [
  'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
  'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav'
]

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

function emit(eventHandler: LiveOpsEventHandler, event: LiveOpsEvent) {
  eventHandler(event)
}

export function connectMockEventStream(handler: LiveOpsEventHandler) {
  let active = true
  const calls = new Map<string, MockCall>()
  const timers: Array<ReturnType<typeof setInterval>> = []

  const startCall = () => {
    const callId = `call_${Math.random().toString(36).slice(2, 10)}`
    const phoneE164 = pick(samplePhones)
    const startedAt = Date.now()
    const call: MockCall = {
      callId,
      phoneE164,
      status: 'active',
      lastSpeaker: 'assistant',
      startedAt
    }
    calls.set(callId, call)
    emit(handler, { type: 'call_started', callId, phoneE164, at: startedAt })
  }

  const appendTranscript = (call: MockCall) => {
    const isCustomer = call.lastSpeaker === 'assistant'
    const nextRole = isCustomer ? 'customer' : 'assistant'
    call.lastSpeaker = nextRole
    emit(handler, {
      type: 'transcript_appended',
      callId: call.callId,
      role: nextRole,
      text: isCustomer ? pick(customerLines) : pick(assistantLines),
      at: Date.now()
    })
  }

  const maybeChangeStatus = (call: MockCall) => {
    const roll = Math.random()
    if (roll < 0.08) {
      call.status = call.status === 'watch' ? 'active' : 'watch'
      emit(handler, {
        type: 'call_status',
        callId: call.callId,
        status: call.status,
        at: Date.now(),
        reason: call.status === 'watch' ? 'Keyword flagged: refund request' : 'Cleared by supervisor'
      })
      return true
    }
    if (roll < 0.1) {
      call.status = 'blocked'
      emit(handler, {
        type: 'call_status',
        callId: call.callId,
        status: 'blocked',
        at: Date.now(),
        reason: 'Repeated chargeback risk'
      })
      return true
    }
    return false
  }

  const endCall = (call: MockCall) => {
    call.status = 'ended'
    emit(handler, {
      type: 'call_status',
      callId: call.callId,
      status: 'ended',
      at: Date.now(),
      reason: 'Order confirmed'
    })
    emit(handler, {
      type: 'recording_ready',
      callId: call.callId,
      url: pick(recordingLinks),
      at: Date.now()
    })
  }

  if (calls.size === 0) {
    startCall()
    startCall()
  }

  timers.push(
    setInterval(() => {
      if (!active) return
      if (calls.size < 4 && Math.random() < 0.25) {
        startCall()
      }
      const callList = Array.from(calls.values()).filter((call) => call.status !== 'ended')
      if (callList.length === 0) {
        startCall()
        return
      }
      const call = pick(callList)
      if (maybeChangeStatus(call)) {
        return
      }
      if (Math.random() < 0.12) {
        endCall(call)
        return
      }
      appendTranscript(call)
    }, 1400)
  )

  return {
    close() {
      active = false
      timers.forEach(clearInterval)
    }
  }
}
