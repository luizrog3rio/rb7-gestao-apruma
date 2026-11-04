import { NextResponse } from 'next/server'
import { fetchProfileWithStatus } from '@/lib/instagram'
import { getRequestRole } from '@/lib/api-auth'

export const maxDuration = 60

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const auth = await getRequestRole(request)
  if (!auth || !['admin', 'gerente'].includes(auth.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { username } = await params
  if (!username || username.length < 2) {
    return NextResponse.json({ error: 'Username inválido' }, { status: 400 })
  }

  const result = await fetchProfileWithStatus(username)
  if (result.status === 'ok') return NextResponse.json(result.profile)

  // Cada motivo tem um status próprio para a tela explicar o que houve.
  if (result.status === 'not_found') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (result.status === 'restricted') {
    return NextResponse.json({ error: 'restricted' }, { status: 403 })
  }
  // Falha das APIs (créditos, limite, chave, rede). O detalhe vai pro log.
  return NextResponse.json({ error: 'provider_error' }, { status: 502 })
}
