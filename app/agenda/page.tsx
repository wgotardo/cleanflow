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
  property_id: string | null
}

type Property = { id: string; address: string; city: string | null; client_id: string | null }
type Client = { id: string; name: string }

export default function AgendaPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [jobs, setJobs] = useState<Job[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const start = new Date(d)
    start.setDate(d.getDate() + diff)
    start.setHours(0, 0, 0, 0)
    return start
  })
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [scheduledAt, setScheduledAt] = useState('')
  const [serviceType, setServiceType] = useState('standard')
  const [price, setPrice] = useState('')
  const [propertyId, setPropertyId] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/')
        return
      }
      await fetchJobs()
      setLoading(false)
    })
  }, [router])

  async function fetchJobs() {
    const { data, error } = await supabase.from('jobs').select('*').order('scheduled_at', { ascending: true })
    if (!error && data) setJobs(data)
    const { data: props } = await supabase.from('properties').select('*')
    if (props) setProperties(props)
    const { data: clis } = await supabase.from('clients').select('id, name')
    if (clis) setClients(clis)
  }

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('jobs').insert({
      scheduled_at: scheduledAt,
      service_type: serviceType,
      price: parseFloat(price) || 0,
      status: 'scheduled',
      property_id: propertyId || null,
    })
    if (!error) {
      setShowForm(false)
      setScheduledAt('')
      setPrice('')
      await fetchJobs()
    }
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('jobs').update({ status }).eq('id', id)
    await fetchJobs()
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const weekLabel = `${weekDays[0].toLocaleDateString(t('locale'), { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString(t('locale'), { day: 'numeric', month: 'short', year: 'numeric' })}`

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  const dayNames = t('dayNames').split(',')
  const filteredJobs = jobs.filter((job) => isSameDay(new Date(job.scheduled_at), selectedDate))

  function getProperty(id: string | null) {
    return properties.find((p) => p.id === id)
  }
  function getClient(id: string | null) {
    return clients.find((c) => c.id === id)
  }

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

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <header className="bg-[#001A3D] text-white px-4 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00B4D8] flex items-center justify-center text-base">💧</div>
            <h1 className="text-base font-bold">{t('appName')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <span className="text-lg">📅</span>
          </div>
        </div>
        <p className="mt-3 text-xl font-bold">{t('schedule')}</p>
        <p className="text-xs text-white/60">{t('scheduleSubtitle')}</p>
      </header>

      <div className="bg-white shadow-sm px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => { const d = new Date(weekStart); d.setDate(weekStart.getDate() - 7); setWeekStart(d) }} className="text-[#00B4D8] text-xl px-2">‹</button>
          <p className="text-sm font-semibold text-[#0A1F44]">{weekLabel}</p>
          <button onClick={() => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + 7); setWeekStart(d) }} className="text-[#00B4D8] text-xl px-2">›</button>
        </div>
        <div className="flex justify-between">
          {weekDays.map((d, i) => {
            const active = isSameDay(d, selectedDate)
            const isToday = isSameDay(d, new Date())
            return (
              <button key={i} onClick={() => setSelectedDate(d)} className={`flex flex-col items-center w-11 py-2 rounded-xl transition ${active ? 'bg-[#00B4D8] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                <span className="text-[10px] font-semibold uppercase">{dayNames[i]}</span>
                <span className="text-sm font-bold">{d.getDate()}</span>
                {isToday && !active && <span className="w-1 h-1 rounded-full bg-[#00B4D8] mt-0.5" />}
              </button>
            )
          })}
        </div>
      </div>

      <main className="p-4 max-w-4xl mx-auto">
        {showForm && (
          <form onSubmit={handleCreateJob} className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
            <p className="text-sm font-semibold text-[#0A1F44]">+ {t('newJob')}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('dateTime')}</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('serviceType')}</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]">
                <option value="standard">{t('serviceStandard')}</option>
                <option value="deep">{t('serviceDeep')}</option>
                <option value="post-construction">{t('servicePostConstruction')}</option>
                <option value="commercial">{t('serviceCommercial')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('property')}</label>
              <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]">
                <option value="">{t('selectProperty')}</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.address}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('price')} (USD)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]" />
            </div>
            <button type="submit" className="w-full bg-[#0A1F44] text-white font-semibold py-2.5 rounded-lg hover:bg-[#12305e] transition">{t('createJob')}</button>
          </form>
        )}

        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">{t('noJobs')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('noJobsHint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const prop = getProperty(job.property_id)
              const client = prop ? getClient(prop.client_id) : null
              const st = statusStyle[job.status] || statusStyle.scheduled
              return (
                <div key={job.id} className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <p className="text-xs text-gray-400">🕐</p>
                    <p className="text-sm font-bold text-[#0A1F44]">
                      {new Date(job.scheduled_at).toLocaleTimeString(t('locale'), { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0A1F44] text-sm truncate">{client?.name || t('withoutClient')}</p>
                    {prop && <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><span className="text-[#00B4D8]">📍</span> {prop.address}</p>}
                    <p className="text-xs text-[#D4AF37] flex items-center gap-1"><span>✨</span> {serviceLabel[job.service_type] || job.service_type}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><span>👤</span> {t('cleaner')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-sm font-bold text-[#0A1F44]">${job.price?.toFixed(2)}</p>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${st.badge}`}>{st.icon} {statusLabel[job.status] || job.status}</span>
                    {job.status !== 'completed' && (
                      <select value={job.status} onChange={(e) => updateStatus(job.id, e.target.value)} className="text-[10px] border border-gray-300 rounded-lg px-1 py-0.5">
                        <option value="scheduled">{t('statusScheduled')}</option>
                        <option value="en_route">{t('statusEnRoute')}</option>
                        <option value="in_progress">{t('statusInProgress')}</option>
                        <option value="completed">{t('statusCompleted')}</option>
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <button onClick={() => setShowForm(!showForm)} className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-[#00B4D8] text-white text-2xl font-bold shadow-lg hover:bg-[#0096b8] transition flex items-center justify-center z-10">+</button>

      <BottomNav />
    </div>
  )
}