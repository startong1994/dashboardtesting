import { useState } from 'react'
import BillingDisputes from './components/BillingDisputes'
import LiveOpsConsole from './components/LiveOpsConsole'
import MenuQuickActions from './components/MenuQuickActions'
import OrderHistory from './components/OrderHistory'

type ViewId = 'live' | 'menu' | 'billing' | 'history'

const views: { id: ViewId; label: string; description: string }[] = [
  { id: 'live', label: 'Live Ops', description: 'Real-time call stream' },
  { id: 'menu', label: 'Menu 86', description: 'Instant availability' },
  { id: 'billing', label: 'Billing', description: 'Revenue & disputes' },
  { id: 'history', label: 'Order History', description: 'Past orders' }
]

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('live')

  return (
    <div className="min-h-screen text-ink">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[360px] w-[360px] rounded-full bg-sky-400/20 blur-[90px]" />
        <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-orange-300/30 blur-[110px]" />
        <div className="absolute bottom-0 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-teal-200/40 blur-[120px]" />
      </div>

      <header className="relative z-10 px-5 pt-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Stage 8 Pilot</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
              Owner Dashboard - Live Ops
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Real-time call visibility, transparent phone display, and intervention tools optimized for iPad.
            </p>
          </div>
          <div className="glass-card flex items-center gap-3 px-4 py-3 text-xs text-slate-700">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Pilot system online
            <span className="rounded-full bg-slate-900 px-2 py-1 font-mono text-[10px] text-white">
              SSE
            </span>
          </div>
        </div>
        <nav className="mt-6 flex flex-wrap gap-2">
          {views.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeView === view.id
                  ? 'bg-slate-900 text-white shadow-soft-xl'
                  : 'border border-white/70 bg-white/70 text-slate-700 hover:border-slate-200'
              }`}
            >
              {view.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="relative z-10 px-5 pb-10 pt-6 sm:px-8">
        {activeView === 'live' && <LiveOpsConsole />}
        {activeView === 'menu' && <MenuQuickActions />}
        {activeView === 'billing' && <BillingDisputes />}
        {activeView === 'history' && <OrderHistory />}
      </main>
    </div>
  )
}
