import { useMemo, useState } from 'react'
import { ChefHat, Clock3, Utensils } from 'lucide-react'

type TicketItem = {
  name: string
  quantity: number
  modifiers: string[]
}

type Ticket = {
  id: string
  phoneE164: string
  placedAt: number
  station: string
  items: TicketItem[]
}

const seedTickets: Ticket[] = [
  {
    id: 'A-1042',
    phoneE164: '+12125550199',
    placedAt: Date.now() - 1000 * 60 * 6,
    station: 'Line 1',
    items: [
      { name: 'General Tso Chicken', quantity: 1, modifiers: ['No cilantro', 'Extra spicy'] },
      { name: 'Egg Roll', quantity: 2, modifiers: [] }
    ]
  },
  {
    id: 'A-1045',
    phoneE164: '+14155552671',
    placedAt: Date.now() - 1000 * 60 * 11,
    station: 'Line 2',
    items: [
      { name: 'Spicy Miso Ramen', quantity: 2, modifiers: ['Add soft egg'] },
      { name: 'Miso Soup', quantity: 1, modifiers: [] }
    ]
  },
  {
    id: 'A-1048',
    phoneE164: '+17185551234',
    placedAt: Date.now() - 1000 * 60 * 18,
    station: 'Expo',
    items: [
      { name: 'Orange Tofu', quantity: 1, modifiers: ['Gluten free', 'Extra sauce'] },
      { name: 'Steamed Rice', quantity: 1, modifiers: [] }
    ]
  }
]

type Toast = {
  id: string
  message: string
}

function formatElapsed(timestamp: number) {
  const diff = Math.floor((Date.now() - timestamp) / 60000)
  if (diff < 1) return 'Just in'
  return `${diff} min`
}

export default function KitchenDisplay() {
  const [tickets, setTickets] = useState<Ticket[]>(seedTickets)
  const [toasts, setToasts] = useState<Toast[]>([])

  const sorted = useMemo(() => {
    return [...tickets].sort((a, b) => a.placedAt - b.placedAt)
  }, [tickets])

  const completeTicket = (ticket: Ticket) => {
    setTickets((prev) => prev.filter((entry) => entry.id !== ticket.id))
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => prev.concat({ id, message: `Ticket ${ticket.id} marked ready.` }))
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 2400)
  }

  return (
    <section className="rounded-3xl bg-slate-950 p-6 text-slate-100 shadow-soft-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Kitchen Display</p>
          <h2 className="text-lg font-semibold text-white">Live Tickets</h2>
          <p className="mt-1 text-xs text-slate-400">High-contrast, cook-friendly view.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
          <Utensils className="h-3.5 w-3.5" />
          {tickets.length} active tickets
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((ticket) => (
          <article
            key={ticket.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="inline-flex items-center gap-2">
                <ChefHat className="h-3.5 w-3.5" />
                {ticket.station}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                {formatElapsed(ticket.placedAt)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Order</p>
                <p className="text-xl font-semibold text-white">{ticket.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Phone</p>
                <p className="font-mono text-sm text-slate-200">{ticket.phoneE164}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {ticket.items.map((item, index) => (
                <div key={`${ticket.id}-${index}`} className="rounded-xl bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      {item.quantity}x {item.name}
                    </span>
                  </div>
                  {item.modifiers.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-rose-400">
                      {item.modifiers.map((modifier) => (
                        <li key={modifier}>- {modifier}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => completeTicket(ticket)}
              className="mt-4 w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
            >
              Complete / Ready
            </button>
          </article>
        ))}
        {sorted.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
            All caught up - no active tickets.
          </div>
        )}
      </div>

      <div className="mt-5 flex w-[240px] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </section>
  )
}
