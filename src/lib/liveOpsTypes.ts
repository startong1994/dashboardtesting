export type CallStatus = 'active' | 'watch' | 'blocked' | 'ended' | 'human'
export type TranscriptRole = 'customer' | 'assistant' | 'system'

export type LiveOpsEvent =
  | {
      type: 'call_started'
      callId: string
      phoneE164: string
      at: number
    }
  | {
      type: 'transcript_appended'
      callId: string
      role: TranscriptRole
      text: string
      at: number
    }
  | {
      type: 'call_status'
      callId: string
      status: CallStatus
      at: number
      reason?: string
    }
  | {
      type: 'recording_ready'
      callId: string
      url: string
      at: number
    }

export type LiveOpsEventHandler = (event: LiveOpsEvent) => void
