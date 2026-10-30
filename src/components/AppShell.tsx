'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import AuthGuard from '@/components/AuthGuard'
import { useUserRole } from '@/lib/useUserRole'
import { stopViewAs } from '@/lib/viewAs'

const mentorAllowedPaths = ['/', '/sos-mentores', '/toque-do-rafa', '/login']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { role, loading, viewingAs } = useUserRole()
  const isLogin = pathname === '/login'

  useEffect(() => {
    if (loading || isLogin) return
    if (role === 'mentor' && !mentorAllowedPaths.includes(pathname)) {
      router.replace('/sos-mentores')
    }
  }, [role, loading, pathname, isLogin, router])

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <Sidebar />
        <main className="lg:ml-64 flex-1 p-4 pt-16 lg:p-8 lg:pt-8 min-w-0">
          {viewingAs && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm">
              <span>
                👁️ Vendo como <strong>{viewingAs.nome || viewingAs.email}</strong>
                <span className="opacity-80"> · {viewingAs.role}{viewingAs.turma ? ` · ${viewingAs.turma}` : ''}</span>
                <span className="block text-xs opacity-80">Só a tela muda: o que você clicar aqui é feito como você. Toques lidos são os seus, não os da pessoa.</span>
              </span>
              <button
                onClick={stopViewAs}
                className="px-3 py-1.5 bg-white text-brand-700 font-medium rounded-lg hover:bg-brand-50 whitespace-nowrap"
              >
                Sair do modo
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
