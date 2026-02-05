import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Ban,
  Headphones,
  PhoneCall,
  ShieldAlert,
  UserRound
} from 'lucide-react'
import type { LiveOpsEvent, CallStatus, TranscriptRole } from '../lib/liveOpsTypes'
import { connectEventStream } from '../lib/eventStream'

type TranscriptEntry = {
  id: string
  role: TranscriptRole
  text: string
  at: number
}

type CallRecord = {
  callId: string
  phoneE164: string
  status: CallStatus
  startedAt: number
  updatedAt: number
  transcript: TranscriptEntry[]
  recordingUrl?: string
  reason?: string
}

type LiveOpsState = {
  calls: Record<string, CallRecord>
}

type Toast = {
  id: string
  title: string
  tone: 'info' | 'success' | 'warning'
}

type MobilePanel = 'list' | 'chat'

const initialState: LiveOpsState = {
  calls: {}
}

function applyEvent(state: LiveOpsState, event: LiveOpsEvent): LiveOpsState {
  switch (event.type) {
    case 'call_started': {
      const existing = state.calls[event.callId]
      const next: CallRecord = {
        callId: event.callId,
        phoneE164: event.phoneE164,
        status: existing?.status ?? 'active',
        startedAt: existing?.startedAt ?? event.at,
        updatedAt: event.at,
        transcript: existing?.transcript ?? [],
        recordingUrl: existing?.recordingUrl,
        reason: existing?.reason
      }
      return {
        calls: { ...state.calls, [event.callId]: next }
      }
    }
    case 'transcript_appended': {
      const target = state.calls[event.callId]
      if (!target) return state
      const transcript: TranscriptEntry[] = target.transcript.concat({
        id: `${event.callId}-${event.at}`,
        role: event.role,
        text: event.text,
        at: event.at
      })
      return {
        ...state,
        calls: {
          ...state.calls,
          [event.callId]: {
            ...target,
            transcript,
            updatedAt: event.at
          }
        }
      }
    }
    case 'call_status': {
      const target = state.calls[event.callId]
      if (!target) return state
      return {
        ...state,
        calls: {
          ...state.calls,
          [event.callId]: {
            ...target,
            status: event.status,
            reason: event.reason ?? target.reason,
            updatedAt: event.at
          }
        }
      }
    }
    case 'recording_ready': {
      const target = state.calls[event.callId]
      if (!target) return state
      return {
        ...state,
        calls: {
          ...state.calls,
          [event.callId]: {
            ...target,
            recordingUrl: event.url,
            updatedAt: event.at
          }
        }
      }
    }
    default:
      return state
  }
}

const statusMeta: Record<CallStatus, { label: string; classes: string; icon: JSX.Element }> = {
  active: {
    label: 'Active',
    classes: 'bg-emerald-500/15 text-emerald-700 border-emerald-400/40',
    icon: <PhoneCall className="h-3.5 w-3.5" />
  },
  watch: {
    label: 'Watch',
    classes: 'bg-amber-500/20 text-amber-700 border-amber-400/50',
    icon: <AlertTriangle className="h-3.5 w-3.5" />
  },
  blocked: {
    label: 'Blocked',
    classes: 'bg-rose-500/15 text-rose-700 border-rose-400/50',
    icon: <Ban className="h-3.5 w-3.5" />
  },
  ended: {
    label: 'Ended',
    classes: 'bg-slate-200 text-slate-600 border-slate-200',
    icon: <Headphones className="h-3.5 w-3.5" />
  },
  human: {
    label: 'Takeover',
    classes: 'bg-indigo-500/15 text-indigo-700 border-indigo-400/50',
    icon: <UserRound className="h-3.5 w-3.5" />
  }
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatRelative(timestamp: number) {
  const diff = Date.now() - timestamp
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

export default function LiveOpsConsole() {
  const [state, dispatch] = useReducer(applyEvent, initialState)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('list')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const transcriptRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const stream = connectEventStream((event) => dispatch(event))
    return () => stream.close()
  }, [])

  const calls = useMemo(() => {
    return Object.values(state.calls).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [state.calls])

  useEffect(() => {
    if (!selectedId && calls.length > 0) {
      setSelectedId(calls[0].callId)
    }
  }, [calls, selectedId])

  const selectedCall = selectedId ? state.calls[selectedId] : calls[0]

  const pushToast = (title: string, tone: Toast['tone']) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => prev.concat({ id, title, tone }))
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3200)
  }

  const setSelected = (callId: string) => {
    setSelectedId(callId)
    setMobilePanel('chat')
    setAutoScroll(true)
  }

  const setCallStatus = (callId: string, status: CallStatus, reason: string) => {
    dispatch({
      type: 'call_status',
      callId,
      status,
      reason,
      at: Date.now()
    })
    pushToast(`Status updated: ${status.toUpperCase()}`, status === 'blocked' ? 'warning' : 'success')
  }

  const handleTakeOver = (callId: string) => {
    setCallStatus(callId, 'human', 'Manual takeover initiated')
    pushToast('AI voice paused - human now handling the call.', 'info')
  }

  useEffect(() => {
    if (!selectedCall || !autoScroll) return
    const el = transcriptRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [selectedCall?.transcript.length, selectedId, autoScroll])

  const handleTranscriptScroll = () => {
    const el = transcriptRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    setAutoScroll(distance < 48)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,minmax(0,1fr)]">
      <aside
        className={`glass-card flex h-[86vh] min-h-0 flex-col p-4 sm:p-5 ${
          mobilePanel === 'list' ? 'flex' : 'hidden'
        } lg:flex`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Live Calls</p>
            <h2 className="text-lg font-semibold text-slate-900">Queue</h2>
          </div>
          <span className="soft-chip">
            <Activity className="h-3.5 w-3.5" />
            {calls.length} streams
          </span>
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
          {calls.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Waiting for incoming calls...
            </div>
          )}
          {calls.map((call) => {
            const meta = statusMeta[call.status]
            const latest = call.transcript[call.transcript.length - 1]
            const isSelected = selectedCall?.callId === call.callId
            return (
              <button
                key={call.callId}
                type="button"
                onClick={() => setSelected(call.callId)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  isSelected
                    ? 'border-slate-900/20 bg-white shadow-soft-xl'
                    : 'border-white/70 bg-white/50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-slate-900">{call.phoneE164}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      meta.classes
                    }`}
                  >
                    {meta.icon}
                    {meta.label}
                  </span>
                </div>
                <p className="mt-2 truncate-2 text-xs text-slate-600">
                  {latest ? `${latest.role === 'customer' ? 'Caller' : 'AI'}: ${latest.text}` : 'Awaiting transcript...'}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Updated {formatRelative(call.updatedAt)}</span>
                  <span>{formatTime(call.startedAt)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section
        className={`glass-card flex h-[86vh] min-h-0 flex-col gap-3 p-4 sm:p-6 ${
          mobilePanel === 'chat' ? 'flex' : 'hidden'
        } lg:flex`}
      >
        {selectedCall ? (
          <>
            <div className="flex max-h-[22vh] flex-col gap-3 overflow-y-auto lg:max-h-none lg:overflow-visible">
              <button
                type="button"
                onClick={() => setMobilePanel('list')}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 lg:hidden"
              >
                Back to calls
              </button>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-mono text-xl text-slate-900">{selectedCall.phoneE164}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                      statusMeta[selectedCall.status].classes
                    }`}
                  >
                    {statusMeta[selectedCall.status].icon}
                    {statusMeta[selectedCall.status].label}
                  </span>
                  {selectedCall.reason && (
                    <span className="soft-chip">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {selectedCall.reason}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTakeOver(selectedCall.callId)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl transition hover:-translate-y-0.5"
                >
                  <UserRound className="h-4 w-4" />
                  Take Over
                </button>
                <button
                  type="button"
                  onClick={() => setCallStatus(selectedCall.callId, 'watch', 'Manual watch flag')}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Mark Watch
                </button>
                <button
                  type="button"
                  onClick={() => setCallStatus(selectedCall.callId, 'blocked', 'Manually blocked by owner')}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                >
                  <Ban className="h-4 w-4" />
                  Block Caller
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="flex items-center justify-end text-xs uppercase tracking-[0.24em] text-slate-500">
                <span>{formatTime(selectedCall.updatedAt)}</span>
              </div>
              <div
                ref={transcriptRef}
                onScroll={handleTranscriptScroll}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2"
              >
                {selectedCall.transcript.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    Awaiting caller audio...
                  </div>
                )}
                {selectedCall.transcript.map((entry) => {
                  const isCustomer = entry.role === 'customer'
                  return (
                    <div
                      key={entry.id}
                      className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          isCustomer
                            ? 'bg-white text-slate-900'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        <p className="text-xs uppercase tracking-[0.18em] opacity-70">
                          {isCustomer ? 'Caller' : 'AI'}
                        </p>
                        <p className="mt-1 leading-relaxed">{entry.text}</p>
                        <p className="mt-2 text-[11px] opacity-60">{formatTime(entry.at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Waiting for incoming calls...
          </div>
        )}
      </section>

      <div className="fixed bottom-6 right-6 z-20 flex w-[260px] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border px-4 py-3 text-sm shadow-soft-xl ${
              toast.tone === 'warning'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : toast.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {toast.title}
          </div>
        ))}
      </div>
    </div>
  )
}
