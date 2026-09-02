'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'
import BottomNav from '@/components/BottomNav'

type Referral = {
  id: string
  referrer_name: string
  referred_name: string
  status: string
  reward_amount: number
}

export default function ReferralsPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [referrerName, setReferrerName] = useState('')
  const [referredName, setReferredName] = useState('')
  const [rewardAmount, setRewardAmount] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/')
        return
      }
      const uid = data.session.user.id
      await fetchReferrals(uid)
      setLoading(false)
    })
  }, [router])

  async function fetchReferrals(uid: string) {
    const { data, error } = await supabase.from('referrals').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50)
    if (!error && data) setReferrals(data)
  }

  async function handleAddReferral(e: React.FormEvent) {
    e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user.id
    const { error } = await supabase.from('referrals').insert({
      referrer_name: referrerName,
      referred_name: referredName,
      status: 'new',
      reward_amount: parseFloat(rewardAmount) || 20,
      user_id: uid,
    })
    if (!error) {
      setShowForm(false)
      setReferrerName('')
      setReferredName('')
      setRewardAmount('')
      await fetchReferrals(uid!)
    }
  }

  const rewardedCount = referrals.filter((r) => r.status === 'rewarded').length
  const totalCredits = referrals.filter((r) => r.status === 'rewarded').reduce((s, r) => s + r.reward_amount, 0)

  const statusLabel: Record<string, string> = {
    new: t('statusNew'), pending: t('statusPending'), rewarded: t('statusRewarded'),
  }
  const statusStyle: Record<string, string> = {
    new: 'bg-gray-100 text-gray-600', pending: 'bg-blue-100 text-blue-600', rewarded: 'bg-green-100 text-green-600',
  }

  function initials(name: string) {
    return name.split(' ').filter((n) => n.length > 0).slice(0, 2).map((n) => n[0].toUpperCase()).join('')
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
          <button onClick={() => setShowForm(true)} className="w-9 h-9 rounded-full bg-[#00B4D8] text-white text-xl font-bold flex items-center justify-center hover:bg-[#0096b8] transition">+</button>
        </div>
        <p className="mt-3 text-xl font-bold">{t('referrals')}</p>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-2xl shrink-0">🎁</div>
            <div>
              <p className="font-bold text-[#0A1F44]">{t('referralRewards')}</p>
              <p className="text-xs text-gray-500">{rewardedCount} {t('referralsRewarded')}</p>
            </div>
          </div>
          <div className="flex items-end justify-between bg-[#0A1F44] text-white rounded-xl p-4">
            <div>
              <p className="text-xs text-white/60">{t('totalCredits')}</p>
              <p className="text-2xl font-bold text-[#D4AF37]">${totalCredits.toFixed(0)}</p>
            </div>
            <span className="text-3xl">🎁</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-[#0A1F44] mb-2">{t('referrals')} ({referrals.length})</h3>

        {referrals.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">{t('noReferrals')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('noReferralsHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00B4D8]/20 text-[#0096b8] flex items-center justify-center text-sm font-bold shrink-0">{initials(r.referrer_name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0A1F44] text-sm truncate">{r.referrer_name}</p>
                  <p className="text-xs text-gray-500 truncate">→ {r.referred_name}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle[r.status] || 'bg-gray-100'}`}>{statusLabel[r.status] || r.status}</span>
                  <p className="text-xs font-semibold text-[#D4AF37]">${r.reward_amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-[#00B4D8] text-white rounded-2xl p-4 mt-4 flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <p className="text-xs flex-1">{t('referralBanner')}</p>
          <button onClick={() => setShowForm(true)} className="bg-white text-[#00B4D8] text-xs font-bold px-3 py-2 rounded-lg shrink-0">{t('referNow')}</button>
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-20 flex items-end justify-center">
          <form onSubmit={handleAddReferral} className="bg-white rounded-t-2xl p-5 w-full max-w-md space-y-3">
            <p className="text-sm font-semibold text-[#0A1F44]">+ {t('addReferral')}</p>
            <input type="text" value={referrerName} onChange={(e) => setReferrerName(e.target.value)} placeholder={t('referrerName')} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]" />
            <input type="text" value={referredName} onChange={(e) => setReferredName(e.target.value)} placeholder={t('referredName')} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]" />
            <input type="number" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} placeholder={t('rewardAmount')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]" />
            <button type="submit" className="w-full bg-[#0A1F44] text-white font-semibold py-2.5 rounded-lg hover:bg-[#12305e] transition">{t('saveReferral')}</button>
            <button type="button" onClick={() => setShowForm(false)} className="w-full text-gray-500 text-sm font-semibold py-2">{t('cancel')}</button>
          </form>
        </div>
      )}

      <BottomNav />
    </div>
  )
}