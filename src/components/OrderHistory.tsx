import { ChevronDown, ChevronUp, Loader2, Printer } from 'lucide-react'
import { useState } from 'react'
import { sendReceiptToCloudPrinter } from '../lib/receiptPrinterApi'

type Toast = {
  id: string
  message: string
  tone: 'success' | 'warning'
}

export default function OrderHistory() {
  const orders = [
    {
      id: 'A-1031',
      placedAt: '12:18 PM',
      confirmedAt: '12:19 PM',
      completedAt: '12:33 PM',
      phoneE164: '+12125550199',
      items: [
        { name: 'General Tso Chicken', qty: 1, price: 14.5, modifiers: ['No cilantro', 'Extra spicy'] },
        { name: 'Egg Roll', qty: 2, price: 4.5, modifiers: [] }
      ],
      subtotal: 23.5,
      tax: 2.12,
      tip: 3.0,
      total: 28.62,
      status: 'Completed',
      channel: 'AI Phone',
      payment: 'Visa **** 4242',
      fulfillment: 'Pickup',
      notes: 'Customer asked for extra napkins.'
    },
    {
      id: 'A-1030',
      placedAt: '11:52 AM',
      confirmedAt: '11:53 AM',
      completedAt: '12:10 PM',
      phoneE164: '+14155552671',
      items: [
        { name: 'Spicy Miso Ramen', qty: 2, price: 13.0, modifiers: ['Add soft egg'] },
        { name: 'Miso Soup', qty: 1, price: 4.0, modifiers: [] }
      ],
      subtotal: 30.0,
      tax: 2.7,
      tip: 5.0,
      total: 37.7,
      status: 'Completed',
      channel: 'AI Phone',
      payment: 'Amex **** 3011',
      fulfillment: 'Pickup',
      notes: 'No peanuts on any items.'
    },
    {
      id: 'A-1027',
      placedAt: '11:07 AM',
      confirmedAt: '11:08 AM',
      completedAt: '11:26 AM',
      phoneE164: '+17185551234',
      items: [
        { name: 'Orange Tofu', qty: 1, price: 12.5, modifiers: ['Gluten free'] },
        { name: 'Steamed Rice', qty: 1, price: 3.0, modifiers: [] }
      ],
      subtotal: 15.5,
      tax: 1.4,
      tip: 3.0,
      total: 19.9,
      status: 'Completed',
      channel: 'AI Phone',
      payment: 'Mastercard **** 5522',
      fulfillment: 'Pickup',
      notes: 'Customer asked for low sodium.'
    }
  ]

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const pushToast = (message: string, tone: Toast['tone']) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => prev.concat({ id, message, tone }))
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 2400)
  }

  const sendReceipt = async (orderId: string) => {
    setPendingIds((prev) => new Set(prev).add(orderId))
    try {
      await sendReceiptToCloudPrinter(orderId)
      pushToast(`Receipt sent for ${orderId}.`, 'success')
    } catch (error) {
      pushToast(`Failed to send receipt for ${orderId}.`, 'warning')
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  const toggleExpanded = (orderId: string) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId))
  }

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`

  return (
    <section className="glass-card p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Order History</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-900">Order History</h2>
      <p className="mt-2 text-sm text-slate-600">
        Order history view placeholder. We can add filters, search, and export here.
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
        <div className="grid grid-cols-[1.1fr,1fr,0.8fr,0.8fr,0.8fr,1.1fr] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
          <span>Order</span>
          <span>Phone</span>
          <span>Items</span>
          <span>Total</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-slate-100">
          {orders.map((order) => (
            <div key={order.id}>
              <div className="grid grid-cols-1 gap-4 px-4 py-4 text-sm text-slate-700 md:grid-cols-[1.1fr,1fr,0.8fr,0.8fr,0.8fr,1.1fr]">
                <div>
                  <p className="font-semibold text-slate-900">{order.id}</p>
                  <p className="text-xs text-slate-500">{order.placedAt}</p>
                </div>
                <div className="font-mono text-sm text-slate-600">{order.phoneE164}</div>
                <div className="text-sm text-slate-700">{order.items.length} items</div>
                <div className="font-semibold text-slate-900">{formatCurrency(order.total)}</div>
                <div className="text-xs font-semibold text-slate-600">{order.status}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(order.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600"
                  >
                    {expandedId === order.id ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    Details
                  </button>
                  <button
                    type="button"
                    disabled={pendingIds.has(order.id)}
                    onClick={() => sendReceipt(order.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      pendingIds.has(order.id)
                        ? 'border-slate-200 bg-slate-100 text-slate-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5'
                    }`}
                  >
                    {pendingIds.has(order.id) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Printer className="h-3.5 w-3.5" />
                    )}
                    Send Receipt
                  </button>
                </div>
              </div>
              {expandedId === order.id && (
                <div className="grid gap-4 border-t border-slate-100 bg-slate-50/60 px-4 py-4 text-sm text-slate-700 md:grid-cols-[1.2fr,0.9fr]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Items</p>
                    <div className="mt-3 space-y-3">
                      {order.items.map((item) => (
                        <div key={item.name} className="rounded-xl bg-white px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">
                              {item.qty}x {item.name}
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              {formatCurrency(item.price * item.qty)}
                            </span>
                          </div>
                          {item.modifiers.length > 0 && (
                            <ul className="mt-2 space-y-1 text-xs text-rose-500">
                              {item.modifiers.map((modifier) => (
                                <li key={modifier}>- {modifier}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Summary</p>
                      <div className="mt-2 space-y-1 text-sm text-slate-700">
                        <div className="flex items-center justify-between">
                          <span>Subtotal</span>
                          <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tax</span>
                          <span className="font-semibold">{formatCurrency(order.tax)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tip</span>
                          <span className="font-semibold">{formatCurrency(order.tip)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                          <span className="font-semibold text-slate-900">Total</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Details</p>
                      <p className="mt-2">Channel: {order.channel}</p>
                      <p>Payment: {order.payment}</p>
                      <p>Fulfillment: {order.fulfillment}</p>
                      <p>Placed: {order.placedAt}</p>
                      <p>Confirmed: {order.confirmedAt}</p>
                      <p>Completed: {order.completedAt}</p>
                    </div>
                    {order.notes && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-amber-600">Notes</p>
                        <p className="mt-1">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
