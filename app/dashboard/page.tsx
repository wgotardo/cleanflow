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
  const [jobs, setJobs] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name)
      }
    }
    load()
  }, [])

  // Cada aba tem seu próprio componente — NUNCA mostram o mesmo conteúdo
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

/* ============ HOME (Dashboard) ============ */
function HomeView({ userName }: { userName: string }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const kpis = [
    { label: 'Faturamento', value: '$4.850', change: '+12%', color: 'text-[#00B4D8]' },
    { label: 'Serviços hoje', value: '6', change: '+20%', color: 'text-[#00B4D8]' },
    { label: 'Clientes ativos', value: '24', change: '+4%', color: 'text-[#00B4D8]' },
    { label: 'Lucro', value: '$2.910', change: '+15%', color: 'text-[#D4AF37]' },
  ]

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-xl font-bold text-[#0A1F44]">
            {greeting}, {userName || 'usuário'} 👋
          </h1>
          <p className="text-sm text-gray-500">Aqui está o resumo do seu negócio hoje.</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#00B4D8] flex items-center justify-center text-lg">💧</div>
      </header>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-green-600">{kpi.change}</p>
          </div>
        ))}
      </div>

      {/* Agenda de hoje (resumo) */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#0A1F44]">Agenda de hoje</h2>
        <a href="/dashboard?tab=schedule" className="text-xs text-[#00B4D8] font-medium">Ver agenda completa</a>
      </div>

      <div className="space-y-3">
        {[
          { time: '08:00 - 09:30', client: 'Ana Souza', address: 'Rua das Flores, 123', status: 'Concluído', statusColor: 'bg-green-100 text-green-700' },
          { time: '10:00 - 11:30', client: 'Carlos Lima', address: 'Av. Paulista, 456', status: 'Em andamento', statusColor: 'bg-blue-100 text-blue-700' },
          { time: '14:00 - 15:30', client: 'Roberta Almeida', address: 'Rua das Palmeiras, 789', status: 'Agendado', statusColor: 'bg-gray-100 text-gray-600' },
        ].map((job, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">{job.time}</p>
                <p className="text-gray-600 text-sm">{job.client}</p>
                <p className="text-gray-400 text-xs">📍 {job.address}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${job.statusColor}`}>{job.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============ AGENDA (separada do Dashboard) ============ */
function ScheduleView() {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const today = new Date().getDate()

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold text-[#0A1F44]">Agenda</h1>
        <p className="text-sm text-gray-500">Gerencie seus serviços do dia</p>
      </header>

      {/* Seletor de semana */}
      <div className="flex gap-2 overflow-x-auto">
        {days.map((d, i) => (
          <div
            key={d}
            className={`flex-1 min-w-[52px] text-center py-2 rounded-lg ${
              i === 2 ? 'bg-[#00B4D8] text-white' : 'bg-white text-gray-600 shadow-sm'
            }`}
          >
            <div className="text-xs">{d}</div>
            <div className="font-bold text-sm">{today + i}</div>
          </div>
        ))}
      </div>

      {/* Lista de serviços — layout DIFERENTE do dashboard */}
      <div className="space-y-3">
        {[
          { time: '09:00', client: 'Ana Souza', service: 'Limpeza Padrão', cleaner: 'Maria', price: '$120', status: 'Concluído', statusColor: 'bg-green-100 text-green-700' },
          { time: '10:30', client: 'Carlos Lima', service: 'Limpeza Profunda', cleaner: 'João', price: '$250', status: 'Em andamento', statusColor: 'bg-blue-100 text-blue-700' },
          { time: '14:00', client: 'Roberta Almeida', service: 'Pós-Obra', cleaner: 'Maria', price: '$400', status: 'Agendado', statusColor: 'bg-gray-100 text-gray-600' },
        ].map((job, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-[#00B4D8]">{job.time}</p>
                <p className="font-semibold text-gray-800">{job.client}</p>
                <p className="text-gray-500 text-sm">{job.service}</p>
                <p className="text-gray-400 text-xs">🧑‍🔧 {job.cleaner} · {job.price}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${job.statusColor}`}>{job.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Botão flutuante para adicionar serviço */}
      <button className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-[#00B4D8] text-white text-2xl shadow-lg flex items-center justify-center">
        +
      </button>
    </div>
  )
}

/* ============ FINANCEIRO ============ */
function FinanceView() {
  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold text-[#0A1F44]">Financeiro</h1>
        <p className="text-sm text-gray-500">Acompanhe suas finanças</p>
      </header>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-xs text-gray-500">Lucro Líquido</p>
        <p className="text-3xl font-bold text-[#D4AF37]">$2.910</p>
        <p className="text-xs text-green-600">+18% vs mês anterior</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500">Receitas</p>
          <p className="font-bold text-[#00B4D8]">$4.850</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500">Despesas</p>
          <p className="font-bold text-red-500">$1.940</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500">Margem</p>
          <p className="font-bold text-green-600">60%</p>
        </div>
      </div>

      <h2 className="font-semibold text-[#0A1F44]">Transações recentes</h2>
      <div className="space-y-2">
        {[
          { icon: '🧹', name: 'Materiais de limpeza', desc: 'Fornecedor', value: '-$150', date: 'Hoje' },
          { icon: '⛽', name: 'Combustível', desc: 'Rota da semana', value: '-$60', date: 'Ontem' },
          { icon: '🔧', name: 'Manutenção', desc: 'Equipamento', value: '-$200', date: 'Seg' },
        ].map((t, i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{t.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{t.name}</p>
                <p className="text-xs text-gray-400">{t.desc} · {t.date}</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-red-500">{t.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============ CLIENTES ============ */
function ClientsView() {
  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold text-[#0A1F44]">Clientes</h1>
        <p className="text-sm text-gray-500">Gerencie seus clientes</p>
      </header>

      {/* Busca */}
      <input
        type="text"
        placeholder="🔍 Buscar cliente..."
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
      />

      {/* Lista de clientes — com endereço, bairro e cidade */}
      <div className="space-y-3">
        {[
          { name: 'Ana Souza', address: 'Rua das Flores, 123', neighborhood: 'Centro', city: 'Orlando', phone: '(407) 555-0100', status: 'Ativo' },
          { name: 'Carlos Lima', address: 'Av. Paulista, 456', neighborhood: 'Bela Vista', city: 'Miami', phone: '(305) 555-0142', status: 'Ativo' },
          { name: 'Roberta Almeida', address: 'Rua das Palmeiras, 789', neighborhood: 'Jardins', city: 'Tampa', phone: '(813) 555-0177', status: 'Inativo' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00B4D8]/10 flex items-center justify-center font-bold text-[#00B4D8]">
                  {c.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.address} · {c.neighborhood}</p>
                  <p className="text-xs text-gray-400">{c.city} · {c.phone}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Botão adicionar cliente */}
      <button className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-[#00B4D8] text-white text-2xl shadow-lg flex items-center justify-center">
        +
      </button>
    </div>
  )
}

/* ============ MAIS (harmonioso) ============ */
function MoreView({ userName }: { userName: string }) {
  const menuItems = [
    { icon: '👤', label: 'Perfil', desc: 'Suas informações pessoais' },
    { icon: '👥', label: 'Equipe & Funcionários', desc: 'Gerencie sua equipe' },
    { icon: '⚙️', label: 'Configurações', desc: 'Preferências do app' },
    { icon: '💳', label: 'Planos & Cobrança', desc: 'Assinatura e pagamentos' },
    { icon: '❓', label: 'Suporte', desc: 'Central de ajuda' },
  ]

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#00B4D8] flex items-center justify-center text-xl">💧</div>
        <div>
          <h1 className="text-xl font-bold text-[#0A1F44]">Mais</h1>
          <p className="text-sm text-gray-500">{userName || 'Conta'}</p>
        </div>
      </header>

      {/* Lista harmoniosa — todos os itens com MESMO tamanho de ícone e espaçamento */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition ${
              i !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            {/* Container de ícone de tamanho FIXO para todos */}
            <div className="w-11 h-11 rounded-xl bg-[#00B4D8]/10 flex items-center justify-center shrink-0">
              <span className="text-lg">{item.icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
            <span className="text-gray-300">›</span>
          </button>
        ))}
      </div>

      {/* Sair */}
      <button className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 text-left hover:bg-red-50 transition">
        <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <span className="text-lg">🚪</span>
        </div>
        <p className="font-medium text-red-600">Sair da conta</p>
      </button>
    </div>
  )
}