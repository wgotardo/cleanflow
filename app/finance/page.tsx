'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'
import BottomNav from '@/components/BottomNav'

type Transaction = {
  id: string
  type: string
  category: string
  amount: number
  created_at: string
}

export default function FinancePage() {
  const router = useRouter()
  const { t } = useI18n()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('job')
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState('supplies')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/')
        return
      }
      const uid = data.session.user.id
      await fetchTransactions(uid)
      setLoading(false)
    })
  }, [router])

  async function fetchTransactions(uid: string) {
    const { data, error } = await supabase
      .from('transactions').select('*').eq('user_id', uid)
      .order('created_at', { ascending: false }).limit(100)
    if (!error && data) setTransactions(data)
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user.id
    const { error } = await supabase.from('transactions').insert({
      type: 'expense', category, amount: parseFloat(amount) || 0, user_id: uid,
    })
    if (!error) {
      setShowForm(false)
      setCategory('supplies')
      setAmount('')
      await fetchTransactions(uid!)
    }
  }

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear

  const isInMonth = (dateStr: string, month: number, year: number) => {
    const d = new Date(dateStr)
    return d.getMonth() === month && d.getFullYear() === year
  }
  const sumByType = (list: Transaction[], type: string) => list.filter((x) => x.type === type).reduce((s, x) => s + x.amount, 0)

  const revenueThis = sumByType(transactions.filter((x) => isInMonth(x.created_at, thisMonth, thisYear)), 'revenue')
  const expensesThis = sumByType(transactions.filter((x) => isInMonth(x.created_at, thisMonth, thisYear)), 'expense')
  const revenueLast = sumByType(transactions.filter((x) => isInMonth(x.created_at, lastMonth, lastYear)), 'revenue')
  const expensesLast = sumByType(transactions.filter((x) => isInMonth(x.created_at, lastMonth, lastYear)), 'expense')

  const profit = revenueThis - expensesThis
  const profitLast = revenueLast - expensesLast
  const margin = revenueThis > 0 ? Math.round((profit / revenueThis) * 100) : 0
  const marginLast = revenueLast > 0 ? Math.round((profitLast / revenueLast) * 100) : 0

  const pct = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? '+100%' : '0%'
    const v = Math.round(((cur - prev) / prev) * 100)
    return `${v >= 0 ? '+' : ''}${v}%`
  }

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - (5 - i), 1)
    const month = d.getMonth()
    const year = d.getFullYear()
    return {
      label: d.toLocaleDateString(t('locale'), { month: 'short' }),
      revenue: sumByType(transactions.filter((x) => isInMonth(x.created_at, month, year)), 'revenue'),
      expenses: sumByType(transactions.filter((x) => isInMonth(x.created_at, month, year)), 'expense'),
    }
  })

  const maxVal = Math.max(1, ...chartData.flatMap((d) => [d.revenue, d.expenses]))
  const niceMax = Math.ceil(maxVal / 1000) * 1000

  const W = 320, H = 140, PAD_L = 34, PAD_B = 22, PAD_T = 10, PAD_R = 10
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => niceMax * f)
  const xStep = plotW / (chartData.length - 1)
  const point = (i: number, v: number) => `${PAD_L + i * xStep},${PAD_T + plotH - (v / niceMax) * plotH}`
  const linePath = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${point(i, v)}`).join(' ')
  const revPath = linePath(chartData.map((d) => d.revenue))
  const expPath = linePath(chartData.map((d) => d.expenses))

  const categoryLabel: Record<string, string> = {
    supplies: t('catSupplies'), fuel: t('catFuel'), maintenance: t('catMaintenance'), labor: t('catLabor'), revenue: t('catRevenue'), other: t('catOther'),
  }
  const categoryIcon: Record<string, { icon: string; bg: string }> = {
    supplies: { icon: '🧴', bg: 'bg-sky-100' },
    fuel: { icon: '⛽', bg: 'bg-orange-100' },
    maintenance: { icon: '🔧', bg: 'bg-yellow-100' },
    labor: { icon: '👷', bg: 'bg-violet-100' },
    revenue: { icon: '💰', bg: 'bg-green-100' },
    other: { icon: '📦', bg: 'bg-gray-100' },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <p className="text-[#0A1F44] font-semibold">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <header className="bg-[#0A1F44] text-white px-4 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00B4D8] flex items-center justify-center text-base">💧</div>
            <h1 className="text-base font-bold">{t('appName')}</h1>
          </div>
          <span className="text-lg">⚙️</span>
        </div>
        <p className="mt-3 text-xl font-bold">{t('finance')}</p>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="flex gap-2 mb-4">
          {[{ id: 'job', label: t('byJob') }, { id: 'client', label: t('byClient') }, { id: 'month', label: t('byMonth') }].map((tabItem) => (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === tabItem.id ? 'bg-[#00B4D8] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {tabItem.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{t('netProfit')}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${profit >= profitLast ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>{pct(profit, profitLast)} {t('vsLastMonth')}</span>
          </div>
          <p className="text-3xl font-bold text-[#D4AF37] mt-1">${profit.toFixed(0)}</p>

          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40 mt-3">
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line x1={PAD_L} y1={PAD_T + plotH - (tick / niceMax) * plotH} x2={W - PAD_R} y2={PAD_T + plotH - (tick / niceMax) * plotH} stroke="#E5E7EB" strokeWidth="1" />
                <text x={PAD_L - 6} y={PAD_T + plotH - (tick / niceMax) * plotH + 3} textAnchor="end" fontSize="9" fill="#9CA3AF">{tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}</text>
              </g>
            ))}
            {chartData.map((d, i) => (
              <text key={i} x={PAD_L + i * xStep} y={H - 6} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.label}</text>
            ))}
            <line x1={PAD_L} y1={PAD_T + plotH} x2={W - PAD_R} y2={PAD_T + plotH} stroke="#D1D5DB" strokeWidth="1" />
            <path d={revPath} fill="none" stroke="#00B4D8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={expPath} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
            {chartData.map((d, i) => (
              <circle key={i} cx={PAD_L + i * xStep} cy={PAD_T + plotH - (d.revenue / niceMax) * plotH} r="3" fill="#00B4D8" />
            ))}
          </svg>

          <div className="flex justify-center gap-4 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#00B4D8]" /> {t('revenue')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-red-400" /> {t('expenses')}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl shadow p-3">
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm mb-2">💰</div>
            <p className="text-sm font-bold text-[#0A1F44]">${revenueThis.toFixed(0)}</p>
            <p className="text-[10px] text-gray-500">{t('revenue')}</p>
            <p className={`text-[10px] font-semibold ${revenueThis >= revenueLast ? 'text-green-600' : 'text-red-500'}`}>{pct(revenueThis, revenueLast)}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm mb-2">💸</div>
            <p className="text-sm font-bold text-[#0A1F44]">${expensesThis.toFixed(0)}</p>
            <p className="text-[10px] text-gray-500">{t('expenses')}</p>
            <p className={`text-[10px] font-semibold ${expensesThis <= expensesLast ? 'text-green-600' : 'text-red-500'}`}>{pct(expensesThis, expensesLast)}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-3">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-sm mb-2">📊</div>
            <p className="text-sm font-bold text-[#0A1F44]">{margin}%</p>
            <p className="text-[10px] text-gray-500">{t('margin')}</p>
            <p className={`text-[10px] font-semibold ${margin >= marginLast ? 'text-green-600' : 'text-red-500'}`}>{pct(margin, marginLast)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#0A1F44]">{t('recentTransactions')}</h3>
          <button className="text-xs text-[#00B4D8] font-semibold">{t('viewAll')} ›</button>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">{t('noTransactions')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
            {transactions.slice(0, 6).map((item) => {
              const cat = categoryIcon[item.category] || categoryIcon.other
              return (
                <div key={item.id} className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${cat.bg} flex items-center justify-center text-lg shrink-0`}>{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0A1F44] text-sm">{categoryLabel[item.category] || item.category}</p>
                    <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString(t('locale'))}</p>
                  </div>
                  <span className={`font-semibold text-sm shrink-0 ${item.type === 'revenue' ? 'text-green-600' : 'text-red-500'}`}>{item.type === 'revenue' ? '+' : '-'}${item.amount.toFixed(2)}</span>
                  <span className="text-gray-300 shrink-0">›</span>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <button onClick={() => setShowForm(!showForm)} className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-[#00B4D8] text-white text-2xl font-bold shadow-lg hover:bg-[#0096b8] transition flex items-center justify-center z-10">+</button>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-20 flex items-end justify-center">
          <form onSubmit={handleAddExpense} className="bg-white rounded-t-2xl p-5 w-full max-w-md space-y-3">
            <p className="text-sm font-semibold text-[#0A1F44]">+ {t('addExpense')}</p>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]">
              <option value="supplies">{t('catSupplies')}</option>
              <option value="fuel">{t('catFuel')}</option>
              <option value="maintenance">{t('catMaintenance')}</option>
              <option value="labor">{t('catLabor')}</option>
              <option value="other">{t('catOther')}</option>
            </select>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]" />
            <button type="submit" className="w-full bg-[#0A1F44] text-white font-semibold py-2.5 rounded-lg hover:bg-[#12305e] transition">{t('saveExpense')}</button>
            <button type="button" onClick={() => setShowForm(false)} className="w-full text-gray-500 text-sm font-semibold py-2">{t('cancel')}</button>
          </form>
        </div>
      )}

      <BottomNav />
    </div>
  )
}