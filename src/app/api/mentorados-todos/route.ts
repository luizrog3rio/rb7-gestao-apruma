import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRequestRole } from '@/lib/api-auth'
import { fetchAll, type Mentorado } from '@/lib/supabase'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Lista os mentorados de TODAS as turmas, só para consulta de referências (ex.:
// achar quem é do nicho Nutri). A RLS limita o mentor à própria turma na leitura
// direta pelo client, então a aba "Todos os mentorados" passa por aqui com service
// role. Somente leitura: qualquer edição continua passando pela RLS normal.
export async function GET(request: Request) {
  const auth = await getRequestRole(request)
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const mentorados = await fetchAll<Mentorado>((from, to) =>
      supabaseAdmin.from('mentorados').select('*').order('nome').order('id').range(from, to)
    )
    return NextResponse.json({ mentorados })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
