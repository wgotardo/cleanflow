'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

type Client = {
  id: string
  name: string
  phone: string | null
  email: string | null
  language: string | null
  notes: string | null
  created_at: string
}

type Property = {
  id: string
  client_id: string
  address: string
  city: string | null
  bedrooms: number | null
  bathrooms: number | null
}

export default function ClientsPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [clients, setClients] = useState<Client[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/')
        return
      }
      await fetchClients()
      setLoading(false)
    })
  }, [router])

  async function fetchClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true })

    if (!error && data) {
      setClients(data)
    }
  }

  async function fetchProperties(clientId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('client_id', clientId)

    if (!error && data) {
      setProperties(data)
    }
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('clients').insert({
      name,
      phone: phone || null,
      email: email || null,
      language,
    })

    if (!error) {
      setShowForm(false)
      setName('')
      setPhone('')
      setEmail('')
      setLanguage('en')
      await fetchClients()
    }
  }

  function openClient(client: Client) {
    setSelectedClient(client)
    fetchProperties(client.id)
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <p className="text-[#0A1F44] font-semibold">{t('loading')}</p>
      </div>
    )
  }

  if (selectedClient) {
    const clientProps = properties.filter(
      (p) => p.client_id === selectedClient.id
    )
    return (
      <div className="min-h-screen bg-[#F5F5F5] pb-20">
        <header className="bg-[#0A1F44] text-white p-4 flex items-center justify-between">
          <button
            onClick={() => setSelectedClient(null)}
            className="text-[#00B4D8] text-sm font-semibold"
          >
            ← {t('back')}
          </button>
          <h1 className="text-lg font-bold">{t('client')}</h1>
          <span className="w-16" />
        </header>

        <main className="p-4 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow p-5 mb-4">
            <h2 className="text-xl font-bold text-[#0A1F44]">
              {selectedClient.name}
            </h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              {selectedClient.phone && (
                <p>📞 {selectedClient.phone}</p>
              )}
              {selectedClient.email && (
                <p>✉️ {selectedClient.email}</p>
              )}
              <p>
                🌐{' '}
                {selectedClient.language === 'pt'
                  ? t('portuguese')
                  : t('english')}
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              {selectedClient.phone && (
                <a
                  href={`tel:${selectedClient.phone}`}
                  className="flex-1 bg-[#00B4D8] text-white text-sm font-semibold py-2 rounded-lg text-center hover:bg-[#0096b8]"
                >
                  📞 {t('call')}
                </a>
              )}
              {selectedClient.phone && (
                <a
                  href={`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-green-500 text-white text-sm font-semibold py-2 rounded-lg text-center hover:bg-green-600"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          <h3 className="text-sm font-semibold text-[#0A1F44] mb-2">
            {t('properties')} ({clientProps.length})
          </h3>
          {clientProps.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-gray-500 text-sm">{t('noProperties')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clientProps.map((p) => (
                <div key={p.id} className="bg-white rounded-xl shadow p-4">
                  <p className="font-semibold text-[#0A1F44]">{p.address}</p>
                  {p.city && (
                    <p className="text-sm text-gray-500">{p.city}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {p.bedrooms || 0} bd · {p.bathrooms || 0} ba
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around">
          {[
            { label: t('home'), path: '/dashboard' },
            { label: t('schedule'), path: '/agenda' },
            { label: t('finance'), path: '/finance' },
            { label: t('clients'), path: '/clients', active: true },
            { label: t('more'), path: '/more' },
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

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      <header className="bg-[#0A1F44] text-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('appName')}</h1>
          <p className="text-sm text-[#00B4D8]">{t('clients')}</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-[#00B4D8] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0096b8]"
        >
          {t('home')}
        </button>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full bg-[#00B4D8] text-white font-semibold py-2.5 rounded-xl hover:bg-[#0096b8] mb-4"
        >
          {showForm ? t('cancel') : `+ ${t('addClient')}`}
        </button>

        {showForm && (
          <form
            onSubmit={handleAddClient}
            className="bg-white rounded-xl shadow p-4 mb-4 space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('name')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={t('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('phone')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('language')}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
              >
                <option value="en">{t('english')}</option>
                <option value="pt">{t('portuguese')}</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-[#0A1F44] text-white font-semibold py-2.5 rounded-lg hover:bg-[#12305e] transition"
            >
              {t('saveClient')}
            </button>
          </form>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">
              {clients.length === 0 ? t('noClients') : t('noClientsFound')}
            </p>
            <p className="text-sm text-gray-400 mt-1">{t('noClientsHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => openClient(c)}
                className="w-full bg-white rounded-xl shadow p-4 flex items-center justify-between hover:bg-gray-50 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0A1F44] text-white flex items-center justify-center font-bold">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0A1F44]">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      {c.phone || t('withoutPhone')}
                    </p>
                  </div>
                </div>
                <span className="text-gray-300">›</span>
              </button>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around">
        {[
          { label: t('home'), path: '/dashboard' },
          { label: t('schedule'), path: '/agenda' },
          { label: t('finance'), path: '/finance' },
          { label: t('clients'), path: '/clients', active: true },
          { label: t('more'), path: '/more' },
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