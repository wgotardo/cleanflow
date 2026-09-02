'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'
import BottomNav from '@/components/BottomNav'

type Property = { id: string; address: string; city: string | null; client_id: string | null }
type Access = { id: string; property_id: string; access_type: string; access_code: string }
type AccessLog = { id: string; property_id: string; action: string; created_at: string }

export default function KeysPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [properties, setProperties] = useState<Property[]>([])
  const [accesses, setAccesses] = useState<Access[]>([])
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/')
        return
      }
      const uid = data.session.user.id
      await Promise.all([fetchProperties(uid), fetchAccesses(uid), fetchLogs(uid)])
      setLoading(false)
    })
  }, [router])

  async function fetchProperties(uid: string) {
    const { data, error } = await supabase.from('properties').select('*').eq('user_id', uid)
    if (!error && data) setProperties(data)
  }
  async function fetchAccesses(uid: string) {
    const { data, error } = await supabase.from('accesses').select('*').eq('user_id', uid)
    if (!error && data) setAccesses(data)
  }
  async function fetchLogs(uid: string) {
    const { data, error } = await supabase.from('access_logs').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(10)
    if (!error && data) setLogs(data)
  }

  const accessTypeLabel: Record<string, string> = {
    lockbox: t('lockbox'), smart_lock: t('smartLock'), physical_key: t('physicalKey'),
  }
  const accessTypeStyle: Record<string, string> = {
    lockbox: 'bg-blue-100 text-blue-700', smart_lock: 'bg-green-100 text-green-700', physical_key: 'bg-yellow-100 text-yellow-700',
  }
  const actionLabel: Record<string, string> = {
    code_revealed: t('codeRevealed'), key_returned: t('keyReturned'), key_borrowed: t('keyBorrowed'),
  }
  const actionIcon: Record<string, string> = {
    code_revealed: '👁️', key_returned: '🔑', key_borrowed: '🔑',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <p className="text-[#0A1F44] font-semibold">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      <header className="bg-[#001A3D] text-white px-4 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00B4D8] flex items-center justify-center text-base">💧</div>
            <h1 className="text-base font-bold">{t('appName')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <div className="w-8 h-8 rounded-full bg-[#00B4D8] flex items-center justify-center text-sm font-bold">U</div>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#0A1F44] text-white flex items-center justify-center text-lg">🛡️</div>
          <div>
            <h2 className="text-lg font-bold text-[#0A1F44]">{t('keysAccess')}</h2>
            <p className="text-xs text-gray-500">{t('securitySubtitle')}</p>
          </div>
        </div>

        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('properties')}</p>

        {properties.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">{t('noPropertiesKeys')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((p) => {
              const access = accesses.find((a) => a.property_id === p.id)
              const type = access?.access_type || 'lockbox'
              const code = access?.access_code || '0000'
              const isRevealed = revealed[p.id]
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow p-3 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-[#0A1F44] flex items-center justify-center text-2xl shrink-0">🏠</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0A1F44] text-sm truncate">{p.address}</p>
                    <p className="text-xs text-gray-500 truncate">{p.city || ''}</p>
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${accessTypeStyle[type] || 'bg-gray-100'}`}>{accessTypeLabel[type] || type}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{t('accessCode')}</p>
                    <p className="font-mono text-sm font-bold text-[#0A1F44]">{isRevealed ? code : `•••• ${code.slice(-4)}`}</p>
                    <button onClick={() => setRevealed({ ...revealed, [p.id]: !isRevealed })} className="text-[#00B4D8] text-sm mt-1">{isRevealed ? '🙈' : '👁️'}</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="bg-[#0A1F44] text-white rounded-2xl p-4 mt-4 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <p className="text-xs text-white/80 flex-1">{t('securityBanner')}</p>
          <span className="text-2xl">🛡️</span>
        </div>

        <div className="flex items-center justify-between mt-5 mb-2">
          <h3 className="text-sm font-semibold text-[#0A1F44]">{t('accessHistory')}</h3>
          <button className="text-xs text-[#00B4D8] font-semibold">{t('viewAll')} ›</button>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-gray-500 text-sm">{t('noAccessLogs')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const prop = properties.find((p) => p.id === log.property_id)
              return (
                <div key={log.id} className="bg-white rounded-xl shadow p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#00B4D8]/20 flex items-center justify-center text-lg shrink-0">{actionIcon[log.action] || '🔑'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0A1F44] text-sm">{t('cleaner')}</p>
                    <p className="text-xs text-gray-500 truncate">{prop?.address || ''}</p>
                    <p className="text-[10px] text-[#00B4D8] font-semibold">{actionLabel[log.action] || log.action}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 shrink-0">{new Date(log.created_at).toLocaleDateString(t('locale'))}</p>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}