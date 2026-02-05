import { useMemo, useState } from 'react'
import { BadgeDollarSign, CircleAlert, RefreshCw } from 'lucide-react'

type BillingStatus = 'paid' | 'disputed' | 'refunded'

type BillingOrder = {
  id: string
  phoneE164: string
  placedAt: number
  gross: number
  net: number
  status: BillingStatus
}

type Toast = {
  id: string
  message: string
  tone: 'success' | 'warning'
}

const seedOrders: BillingOrder[] = [
  { id: 'A-1042', phoneE164: '+12125550199', placedAt: Date.now() - 1000 * 60 * 20, gross: 38.5, net: 34.65, status: 'paid' },
  { id: 'A-1045', phoneE164: '+14155552671', placedAt: Date.now() - 1000 * 60 * 45, gross: 52.0, net: 46.8, status: 'paid' },
  { id: 'A-1039', phoneE164: '+17185551234', placedAt: Date.now() - 1000 * 60 * 90, gross: 27.25, net: 24.0, status: 'disputed' },
  { id: 'A-1036', phoneE164: '+12135557890', placedAt: Date.now() - 1000 * 60 * 120, gross: 64.75, net: 57.2, status: 'refunded' }
]

const statusMeta: Record<BillingStatus, { label: string; classes: string }> = {
  paid: { label: 'Paid', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  disputed: { label: 'Disputed', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  refunded: { label: 'Refunded', classes: 'bg-slate-100 text-slate-600 border-slate-200' }
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function BillingDisputes() {
  const [orders, setOrders] = useState<BillingOrder[]>(seedOrders)
  const [toasts, setToasts] = useState<Toast[]>([])

  const totals = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.gross += order.gross
        acc.net += order.net
        return acc
      },
      { gross: 0, net: 0 }
    )
  }, [orders])

  const pushToast = (message: string, tone: Toast['tone']) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => prev.concat({ id, message, tone }))
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 2400)
  }

  const issueRefund = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: 'refunded', net: 0 }
          : order
      )
    )
    pushToast(`Refund issued for ${orderId}.`, 'warning')
  }

  const markDisputed = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: 'disputed' } : order
      )
    )
    pushToast(`Order ${orderId} marked as disputed.`, 'warning')
  }

  return (
    <section className="glass-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Billing & Disputes</p>
          <h2 className="text-lg font-semibold text-slate-900">Revenue Overview</h2>
          <p className="mt-1 text-xs text-slate-500">Monitor gross vs net and manage disputes instantly.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-xs text-slate-600">
          <BadgeDollarSign className="h-4 w-4 text-emerald-500" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Totals (24h)</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatCurrency(totals.gross)} gross · {formatCurrency(totals.net)} net
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
        <div className="grid grid-cols-[1.1fr,1fr,1fr,1fr,1fr] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
          <span>Order</span>
          <span>Phone</span>
          <span>Gross</span>
          <span>Net</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-slate-100">
          {orders.map((order) => (
            <div key={order.id} className="grid grid-cols-1 gap-4 px-4 py-4 text-sm text-slate-700 md:grid-cols-[1.1fr,1fr,1fr,1fr,1fr]">
              <div>
                <p className="font-semibold text-slate-900">{order.id}</p>
                <p className="text-xs text-slate-500">{formatTime(order.placedAt)}</p>
              </div>
              <div className="font-mono text-sm text-slate-600">{order.phoneE164}</div>
              <div className="font-semibold text-slate-900">{formatCurrency(order.gross)}</div>
              <div className="font-semibold text-slate-900">{formatCurrency(order.net)}</div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    statusMeta[order.status].classes
                  }`}
                >
                  {statusMeta[order.status].label}
                </span>
                <div className="flex items-center gap-2">
                  {order.status !== 'refunded' && (
                    <button
                      type="button"
                      onClick={() => issueRefund(order.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Issue Refund
                    </button>
                  )}
                  {order.status === 'paid' && (
                    <button
                      type="button"
                      onClick={() => markDisputed(order.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700"
                    >
                      <CircleAlert className="h-3 w-3" />
                      Mark Disputed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex w-[240px] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border px-3 py-2 text-xs ${
              toast.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </section>
  )
}
