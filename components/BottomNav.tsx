'use client'

import { useRouter } from 'next/navigation'

const items = [
  { key: 'home', label: 'Início', icon: '🏠' },
  { key: 'schedule', label: 'Agenda', icon: '📅' },
  { key: 'finance', label: 'Financeiro', icon: '💰' },
  { key: 'clients', label: 'Clientes', icon: '👥' },
  { key: 'more', label: 'Mais', icon: '⋯' },
]

// active agora é OPCIONAL (com ? e valor padrão '')
// Isso faz TODAS as páginas funcionarem, mesmo sem passar a prop
export default function BottomNav({ active = '' }: { active?: string }) {
  const router = useRouter()

  function navigate(key: string) {
    router.push(`/dashboard?tab=${key}`)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2"
            >
              <span className={`text-[22px] leading-none ${isActive ? 'text-[#00B4D8]' : 'text-gray-400'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-[#00B4D8]' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}