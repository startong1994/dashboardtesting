import { useMemo, useState } from 'react'
import { CheckCircle2, CloudOff, Flame, Loader2, Pencil, Save, X } from 'lucide-react'
import { sendMenuAvailability } from '../lib/menu86Api'

type MenuItem = {
  id: string
  name: string
  category: string
  last7d: number
  available: boolean
  price: number
}

type Toast = {
  id: string
  message: string
  tone: 'success' | 'warning'
}

const seedItems: MenuItem[] = [
  { id: 'm-001', name: 'General Tso Chicken', category: 'Entree', last7d: 128, available: true, price: 14.5 },
  { id: 'm-002', name: 'Spicy Miso Ramen', category: 'Noodles', last7d: 102, available: true, price: 13.0 },
  { id: 'm-003', name: 'Orange Tofu', category: 'Vegetarian', last7d: 88, available: true, price: 12.5 },
  { id: 'm-004', name: 'Karaage Chicken', category: 'Appetizer', last7d: 76, available: true, price: 9.25 },
  { id: 'm-005', name: 'Udon Combo Bowl', category: 'Noodles', last7d: 64, available: false, price: 15.75 }
]

export default function MenuQuickActions() {
  const [items, setItems] = useState<MenuItem[]>(seedItems)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftPrice, setDraftPrice] = useState('')

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => b.last7d - a.last7d)
  }, [items])

  const pushToast = (message: string, tone: Toast['tone']) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => prev.concat({ id, message, tone }))
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 2600)
  }

  const toggleAvailability = async (item: MenuItem) => {
    const nextAvailable = !item.available
    setItems((prev) =>
      prev.map((entry) => (entry.id === item.id ? { ...entry, available: nextAvailable } : entry))
    )
    setPendingIds((prev) => new Set(prev).add(item.id))

    try {
      await sendMenuAvailability(item.id, nextAvailable)
      pushToast(
        `${item.name} is now ${nextAvailable ? 'available' : '86\'d'}.`,
        nextAvailable ? 'success' : 'warning'
      )
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id)
    setDraftPrice(item.price.toFixed(2))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraftPrice('')
  }

  const savePrice = (item: MenuItem) => {
    const parsed = Number(draftPrice)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      pushToast('Enter a valid price.', 'warning')
      return
    }
    setItems((prev) =>
      prev.map((entry) => (entry.id === item.id ? { ...entry, price: parsed } : entry))
    )
    setEditingId(null)
    pushToast(`${item.name} price updated to $${parsed.toFixed(2)}.`, 'success')
  }

  return (
    <section className="glass-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Menu 86 Switch</p>
          <h2 className="text-lg font-semibold text-slate-900">Top Selling Items</h2>
          <p className="mt-1 text-xs text-slate-500">
            Toggle items off instantly to stop the AI from accepting unavailable dishes.
          </p>
        </div>
        <span className="soft-chip">
          <Flame className="h-3.5 w-3.5" />
          Live inventory
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {sorted.map((item) => {
          const isPending = pendingIds.has(item.id)
          return (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/80 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-slate-900">{item.name}</span>
                  {!item.available && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                      <CloudOff className="h-3 w-3" />
                      86
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {item.category} · {item.last7d} orders (7d)
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  {editingId === item.id ? (
                    <>
                      <input
                        value={draftPrice}
                        onChange={(event) => setDraftPrice(event.target.value)}
                        className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => savePrice(item)}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                        ${item.price.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit price
                      </button>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => toggleAvailability(item)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  item.available
                    ? 'bg-emerald-500 text-slate-900'
                    : 'bg-slate-900 text-white'
                } ${isPending ? 'opacity-70' : 'hover:-translate-y-0.5'}`}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {item.available ? 'Available' : 'Unavailable'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">Auto-sync enabled</span>
        <span>Changes apply to the AI ordering flow immediately.</span>
      </div>

      <div className="mt-4 flex w-[240px] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border px-3 py-2 text-xs ${
              toast.tone === 'warning'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
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
