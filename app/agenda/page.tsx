'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'
import BottomNav from '@/components/BottomNav'

type Job = {
  id: string
  scheduled_at: string
  service_type: string
  price: number
  status: string
}

type Transaction = {
  id: string
  type: string
  amount: number
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [jobsToday, setJobsToday] = useState(0)
  const [activeClients, setActiveClients] = useState(0)
  const [todayJobs, setTodayJobs] = useState<Job[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/')
        return
      }
      setUser(data.session.user)
      const uid = data.session.user.id
      await Promise.all([fetchFinance(uid), fetchJobsToday(uid), fetchClients(uid)])
      setLoading(false)
    })
  }, [router])

  async function fetchFinance(uid: string) {
    const { data, error } = await supabase
      .from('transactions').select('type, amount, created_at').eq('user_id', uid)
    if (!error && data) {
      const list = data as Transaction[]
      const rev = list.filter((x) => x.type === 'revenue').reduce((s, x) => s + x.amount, 0)
      const exp = list.filter((x) => x.type === 'expense').reduce((s, x) => s + x.amount, 0)
      setRevenue(rev)
      setExpenses(exp)
    }
  }

  async function fetchJobsToday(uid: string) {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', uid)
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at', { ascending: true })
    if (!error && data) {
      setJobsToday(data.length)
      setTodayJobs(data)
    }
  }

  async function fetchClients(uid: string) {
    const { count, error } = await supabase
      .from('clients').select('id', { count: 'exact', head: true }).eq('user_id', uid)
    if (!error) setActiveClients(count || 0)
  }

  const profit = revenue - expenses

  const serviceLabel: Record<string, string> = {
    standard: t('serviceStandard'),
    deep: t('serviceDeep'),
    'post-construction': t('servicePostConstruction'),
    commercial: t('serviceCommercial'),
  }

  const statusLabel: Record<string, string> = {
    scheduled: t('statusScheduled'),
    en_route: t('statusEnRoute'),
    in_progress: t('statusInProgress'),
    completed: t('statusCompleted'),
  }

  const statusStyle: Record<string, { badge: string; icon: string }> = {
    scheduled: { badge: 'bg-gray-100 text-gray-600', icon: '🕐' },
    en_route: { badge: 'bg-blue-100 text-blue-600', icon: '🚗' },
    in_progress: { badge: 'bg-[#00B4D8]/15 text-[#0096b8]', icon: '🔄' },
    completed: { badge: 'bg-green-100 text-green-600', icon: '✓' },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <p className="text-[#0A1F44] font-semibold">{t('loading')}</p>
      </div>
    )
  }

  const firstName = (user?.email || 'User').split('@')[0]

  const kpis = [
    { label: t('revenue'), value: `$${revenue.toFixed(0)}`, icon: '💵', iconBg: 'bg-[#00B4D8]/15', delta: '+12%', valueColor: 'text-[#0A1F44]' },
    { label: t('jobsToday'), value: `${jobsToday}`, icon: '💼', iconBg: 'bg-[#00B4D8]/15', delta: '+20%', valueColor: 'text-[#0A1F44]' },
    { label: t('activeClients'), value: `${activeClients}`, icon: '👥', iconBg: 'bg-[#00B4D8]/15', delta: '+4%', valueColor: 'text-[#0A1F44]' },
    { label: t('profit'), value: `$${profit.toFixed(0)}`, icon: '📈', iconBg: 'bg-[#D4AF37]/20', delta: '+15%', valueColor: 'text-[#D4AF37]' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      <header className="bg-[#0A1F44] text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00B4D8] flex items-center justify-center text-base">💧</div>
            <div>
              <h1 className="text-base font-bold leading-tight">{t('appName')}</h1>
              <p className="text-[10px] text-white/60">{t('tagline')}</p>
            </div>
          </div>
          <div className="relative">
            <span className="text-xl">🔔</span>
            <span className="absolute -top-1 -right-1 bg-[#00B4D8] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</span>
          </div>
        </div>
        <p className="mt-4 text-lg font-semibold">{t('goodMorning')}, {firstName}</p>
        <p className="text-xs text-white/60">{t('welcomeBack')}</p>
      </header>

      <main className="px-4 -mt-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-3 mb-5">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-full ${k.iconBg} flex items-center justify-center text-lg`}>{k.icon}</div>
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">{k.delta}</span>
              </div>
              <p className={`text-xl font-bold mt-3 ${k.valueColor}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#0A1F44]">{t('todaySchedule')}</h3>
          <button onClick={() => router.push('/agenda')} className="text-xs text-[#00B4D8] font-semibold">{t('viewFullSchedule')} ›</button>
        </div>

        {todayJobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">{t('noJobs')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayJobs.map((job) => {
              const st = statusStyle[job.status] || statusStyle.scheduled
              return (
                <button key={job.id} onClick={() => router.push('/agenda')} className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 transition text-left">
                  <div className="flex flex-col items-center w-12 shrink-0">
                    <p className="text-sm font-bold text-[#0A1F44]">
                      {new Date(job.scheduled_at).toLocaleTimeString(t('locale'), { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="w-0.5 h-8 bg-[#00B4D8] rounded-full mt-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0A1F44] text-sm truncate">{serviceLabel[job.service_type] || job.service_type}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><span className="text-[#00B4D8]">📍</span> {t('propertyAddress')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${st.badge}`}>{st.icon} {statusLabel[job.status] || job.status}</span>
                    <span className="text-gray-300">›</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}