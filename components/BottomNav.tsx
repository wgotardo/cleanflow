'use client'

import { useRouter, usePathname } from 'next/navigation'

function Icon({ d, active }: { d: string; active: boolean }) {
  const c = active ? '#00B4D8' : '#9CA3AF'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const icons: Record<string, string> = {
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  schedule: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18',
  finance: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  clients: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  more: 'M12 12h.01 M12 5h.01 M12 19h.01',
}

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const items = [
    { label: 'Home', path: '/dashboard', key: 'home' },
    { label: 'Schedule', path: '/agenda', key: 'schedule' },
    { label: 'Finance', path: '/finance', key: 'finance' },
    { label: 'Clients', path: '/clients', key: 'clients' },
    { label: 'More', path: '/more', key: 'more' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-2 pt-1 flex justify-around z-20">
      {items.map((item) => {
        const active = pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center text-[10px] font-semibold relative ${active ? 'text-[#00B4D8]' : 'text-gray-400'}`}
          >
            {active && <span className="absolute -top-1 w-6 h-0.5 bg-[#00B4D8] rounded-full" />}
            <span className="leading-none"><Icon d={icons[item.key]} active={active} /></span>
            <span className="mt-1">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}