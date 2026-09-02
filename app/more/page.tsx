'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

export default function MorePage() {
  const router = useRouter()
  const { t, lang, setLang } = useI18n()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/')
        return
      }
      setUser(data.session.user)
      setLoading(false)
    })
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <p className="text-[#0A1F44] font-semibold">{t('loading')}</p>
      </div>
    )
  }

  const menuItems = [
    {
      path: '/keys',
      icon: '🛡️',
      title: t('keysAccess'),
      subtitle: t('security'),
      accent: 'bg-[#0A1F44]',
    },
    {
      path: '/referrals',
      icon: '🎁',
      title: t('referrals'),
      subtitle: t('referralRewards'),
      accent: 'bg-[#00B4D8]',
    },
    {
      path: '/photos',
      icon: '📸',
      title: t('photos'),
      subtitle: t('gallery'),
      accent: 'bg-[#D4AF37]',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      <header className="bg-[#0A1F44] text-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('appName')}</h1>
          <p className="text-sm text-[#00B4D8]">{t('more')}</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-[#00B4D8] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0096b8]"
        >
          {t('home')}
        </button>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {/* Perfil do usuário */}
        <div className="bg-white rounded-2xl shadow p-5 mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#0A1F44] text-white flex items-center justify-center text-lg font-bold">
            {(user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#0A1F44] truncate">
              {user?.email}
            </p>
            <p className="text-xs text-gray-400">
              {t('dashboard')} · CleanFlow
            </p>
          </div>
        </div>

        {/* Seletor de idioma */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <p className="text-sm font-semibold text-[#0A1F44] mb-3">
            🌐 {t('language')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('en')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition border ${
                lang === 'en'
                  ? 'bg-[#0A1F44] text-white border-[#0A1F44]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#00B4D8]'
              }`}
            >
              <img
                src="https://flagcdn.com/w20/us.png"
                alt="EN"
                className="w-5 h-4 rounded-sm object-cover"
              />
              English
            </button>
            <button
              onClick={() => setLang('pt')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition border ${
                lang === 'pt'
                  ? 'bg-[#0A1F44] text-white border-[#0A1F44]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#00B4D8]'
              }`}
            >
              <img
                src="https://flagcdn.com/w20/br.png"
                alt="PT"
                className="w-5 h-4 rounded-sm object-cover"
              />
              Português
            </button>
          </div>
        </div>

        {/* Menu de opções */}
        <div className="space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="w-full bg-white rounded-2xl shadow p-4 flex items-center gap-4 hover:bg-gray-50 transition text-left"
            >
              <div
                className={`w-12 h-12 rounded-xl ${item.accent} text-white flex items-center justify-center text-xl`}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#0A1F44]">{item.title}</p>
                <p className="text-xs text-gray-500">{item.subtitle}</p>
              </div>
              <span className="text-gray-300 text-xl">›</span>
            </button>
          ))}
        </div>

        {/* Sair */}
        <button
          onClick={handleLogout}
          className="w-full mt-6 bg-white rounded-2xl shadow p-4 flex items-center gap-4 hover:bg-red-50 transition text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center text-xl">
            🚪
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-600">{t('logout')}</p>
            <p className="text-xs text-gray-500">
              {t('logout')} · CleanFlow
            </p>
          </div>
          <span className="text-gray-300 text-xl">›</span>
        </button>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around">
        {[
          { label: t('home'), path: '/dashboard' },
          { label: t('schedule'), path: '/agenda' },
          { label: t('finance'), path: '/finance' },
          { label: t('clients'), path: '/clients' },
          { label: t('more'), path: '/more', active: true },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center text-xs font-semibold ${
              item.active ? 'text-[#00B4D8]' : 'text-gray-400'
            }`}
          >
            <span className="text-lg">
              {item.path === '/dashboard' && '🏠'}
              {item.path === '/agenda' && '📅'}
              {item.path === '/finance' && '💰'}
              {item.path === '/clients' && '👥'}
              {item.path === '/more' && '⋯'}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}