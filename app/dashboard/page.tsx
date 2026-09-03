'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F5]" />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'home'
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {tab === 'home' && <HomeView userName={userName} />}
      {tab === 'schedule' && <ScheduleView />}
      {tab === 'finance' && <FinanceView />}
      {tab === 'clients' && <ClientsView />}
      {tab === 'more' && <MoreView userName={userName} />}
      <BottomNav active={tab} />
    </div>
  )
}

/* ============ HOME — dados reais do Supabase ============ */
function HomeView({ userName }: { userName: string }) {
  const [kpis, setKpis] = useState({ revenue: 0, jobsToday: 0, activeClients: 0, profit: 0 })
  const [todayJobs, setTodayJobs] = useState<any[]>([])
  const [notifications, setNotifications] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      // KPIs
      const [revRes, jobsRes, clientsRes, profitRes, notifRes] = await Promise.all([
        supabase.from('transactions').select('amount').eq('type', 'income'),
        supabase.from('jobs').select('id').gte('scheduled_at', todayStart.toISOString()).lte('scheduled_at', todayEnd.toISOString()),
        supabase.from('clients').select('id').eq('status', 'active'),
        supabase.from('transactions').select('amount').eq('type', 'income'),
        supabase.from('notifications').select('id').eq('read', false),
      ])

      const revenue = (revRes.data || []).reduce((s, t) => s + (t.amount || 0), 0)
      const expenses = (profitRes.data || []).reduce((s, t) => s + (t.amount || 0), 0)

      setKpis({
        revenue,
        jobsToday: jobsRes.data?.length || 0,
        activeClients: clientsRes.data?.length || 0,
        profit: revenue - expenses,
      })
      setNotifications(notifRes.data?.length || 0)

      // Agenda de hoje
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, scheduled_at, client_id, status, clients(name, address)')
        .gte('scheduled_at', todayStart.toISOString())
        .lte('scheduled_at', todayEnd.toISOString())
        .order('scheduled_at', { ascending: true })
      setTodayJobs(jobs || [])
      setLoading(false)
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const kpiCards = [
    { label: 'Faturamento este mês', value: kpis.revenue, format: 'currency', icon: '💰' },
    { label: 'Serviços hoje', value: kpis.jobsToday, format: 'number', icon: '🧹' },
    { label: 'Clientes ativos', value: kpis.activeClients, format: 'number', icon: '👥' },
    { label: 'Lucro este mês', value: kpis.profit, format: 'currency', accent: true, icon: '📈' },
  ]

  function formatValue(v: number, format: string) {
    if (format === 'currency') {
      return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    }
    return String(v)
  }

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Cabeçalho — logo + notificações */}
      <header className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0A1F44] flex items-center justify-center">
            <span className="text-white text-lg leading-none">💧</span>
          </div>
          <span className="text-lg font-bold text-[#0A1F44] tracking-tight">CleanFlow</span>
        </div>
        <div className="relative">
          <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">🔔</button>
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {notifications}
            </span>
          )}
        </div>
      </header>

      {/* Saudação */}
      <div>
        <h1 className="text-[22px] font-bold text-[#0A1F44]">{greeting}, {userName || 'usuário'} 👋</h1>
        <p className="text-sm text-gray-500">Aqui está o resumo do seu negócio hoje.</p>
      </div>

      {/* Cards de métricas — dados reais */}
      <div className="grid grid-cols-2 gap-3">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{kpi.icon}</span>
              <p className="text-xs text-gray-500">{kpi.label}</p>
            </div>
            <p className={`text-2xl font-bold mt-2 ${kpi.accent ? 'text-[#D4AF37]' : 'text-[#0A1F44]'}`}>
              {loading ? '…' : formatValue(kpi.value, kpi.format)}
            </p>
          </div>
        ))}
      </div>

      {/* Agenda de hoje */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="font-semibold text-[15px] text-[#0A1F44]">Agenda de hoje</h2>
        <a href="/dashboard?tab=schedule" className="text-xs text-[#00B4D8] font-medium">Ver agenda completa</a>
      </div>

      {/* Lista de compromissos reais */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : todayJobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-gray-500 text-sm">Nenhum serviço agendado para hoje.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {todayJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">
                    {new Date(job.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-gray-600 text-sm mt-0.5">{job.clients?.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">📍 {job.clients?.address}</p>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                  job.status === 'completed' ? 'bg-green-100 text-green-700' :
                  job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {job.status === 'completed' ? 'Concluído' :
                   job.status === 'in_progress' ? 'Em andamento' : 'Agendado'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============ AGENDA ============ */
function ScheduleView() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <header className="pt-2">
        <h1 className="text-xl font-bold text-[#0A1F44]">Agenda</h1>
        <p className="text-sm text-gray-500">Gerencie seus serviços</p>
      </header>
      <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
        <p className="text-3xl mb-2">📅</p>
        <p className="text-gray-500 text-sm">Tela em construção — próxima etapa.</p>
      </div>
    </div>
  )
}

/* ============ FINANCEIRO ============ */
function FinanceView() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <header className="pt-2">
        <h1 className="text-xl font-bold text-[#0A1F44]">Financeiro</h1>
        <p className="text-sm text-gray-500">Acompanhe suas finanças</p>
      </header>
      <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
        <p className="text-3xl mb-2">💰</p>
        <p className="text-gray-500 text-sm">Tela em construção — próxima etapa.</p>
      </div>
    </div>
  )
}

/* ============ CLIENTES ============ */
function ClientsView() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <header className="pt-2">
        <h1 className="text-xl font-bold text-[#0A1F44]">Clientes</h1>
        <p className="text-sm text-gray-500">Gerencie seus clientes</p>
      </header>
      <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
        <p className="text-3xl mb-2">👥</p>
        <p className="text-gray-500 text-sm">Tela em construção — próxima etapa.</p>
      </div>
    </div>
  )
}

/* ============ MAIS ============ */
function MoreView({ userName }: { userName: string }) {
  const menuItems = [
    { icon: '👤', label: 'Perfil' },
    { icon: '👥', label: 'Equipe & Funcionários' },
    { icon: '⚙️', label: 'Configurações' },
    { icon: '💳', label: 'Planos & Cobrança' },
    { icon: '❓', label: 'Suporte' },
  ]
  return (
    <div className="px-4 pt-4 space-y-4">
      <header className="pt-2 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#00B4D8] flex items-center justify-center text-xl">💧</div>
        <div>
          <h1 className="text-xl font-bold text-[#0A1F44]">Mais</h1>
          <p className="text-sm text-gray-500">{userName || 'Conta'}</p>
        </div>
      </header>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {menuItems.map((item, i) => (
          <button key={item.label} className={`w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition ${i !== menuItems.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <div className="w-11 h-11 rounded-xl bg-[#00B4D8]/10 flex items-center justify-center shrink-0">
              <span className="text-lg">{item.icon}</span>
            </div>
            <p className="flex-1 font-medium text-gray-800">{item.label}</p>
            <span className="text-gray-300">›</span>
          </button>
        ))}
      </div>
      <button className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 text-left hover:bg-red-50 transition">
        <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <span className="text-lg">🚪</span>
        </div>
        <p className="font-medium text-red-600">Sair da conta</p>
      </button>
    </div>
  )
}