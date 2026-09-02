'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n'

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? '#00B4D8' : '#9CA3AF'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function CalendarIcon({ active }: { active: boolean }) {
  const c = active ? '#00B4D8' : '#9CA3AF'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function FinanceIcon({ active }: { active: boolean }) {
  const c = active ? '#00B4D8' : '#9CA3AF'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <path d="M16 8.5c0-1.5-1.8-2.5-4-2.5s-4 1-4 2.5 1.8 2.5 4 2.5 4 1 4 2.5-1.8 2.5-4 2.5-4-1-4-2.5" />
    </svg>
  )
}

function ClientsIcon({ active }: { active: boolean }) {
  const c = active ? '#00B4D8' : '#9CA3AF'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function MoreIcon({ active }: { active: boolean }) {
  const c = active ? '#00B4D8' : '#9CA3AF'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useI18n()

  const items = [
    { label: 'home', path: '/dashboard', icon: (a: boolean) => <HomeIcon active={a} /> },
    { label: 'schedule', path: '/agenda', icon: (a: boolean) => <CalendarIcon active={a} /> },
    { label: 'finance', path: '/finance', icon: (a: boolean) => <FinanceIcon active={a} /> },
    { label: 'clients', path: '/clients', icon: (a: boolean) => <ClientsIcon active={a} /> },
    { label: 'more', path: '/more', icon: (a: boolean) => <MoreIcon active={a} /> },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-2 pt-1 flex justify-around z-20">
      {items.map((item) => {
        const active = pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center text-[10px] font-semibold relative ${
              active ? 'text-[#00B4D8]' : 'text-gray-400'
            }`}
          >
            {active && <span className="absolute -top-1 w-6 h-0.5 bg-[#00B4D8] rounded-full" />}
            <span className="leading-none">{item.icon(active)}</span>
            <span className="mt-1">{t(item.label)}</span>
          </button>
        )
      })}
    </nav>
  )
}