import type { UserRole } from './useUserRole'

// "Ver como": o admin enxerga o painel com o papel/turma/capacidades de outro
// usuário, sem trocar de sessão. Só muda o que a TELA mostra — o banco e as API
// routes continuam vendo o admin, então nada fica registrado no nome da pessoa.
// Fica no sessionStorage: some ao fechar a aba.
export type ViewAs = {
  userId: string
  nome: string
  email: string
  role: UserRole
  turma: string | null
  caps: string[]
}

const KEY = 'apruma:view-as'

export function getViewAs(): ViewAs | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ViewAs) : null
  } catch {
    return null
  }
}

export function startViewAs(v: ViewAs) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    return
  }
  // Recarrega pra todos os useUserRole (sidebar, página, guard) lerem o novo papel.
  window.location.href = '/'
}

export function stopViewAs() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {}
  window.location.href = '/usuarios'
}
