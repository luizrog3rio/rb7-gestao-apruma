import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRequestRole } from '@/lib/api-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Gera um token novo de definição de senha para o admin mandar à pessoa (WhatsApp etc.),
// sem depender do e-mail. Devolve só o hashed_token: o cliente monta o link para
// /definir-senha, que valida o token via JS — assim o preview de link do WhatsApp
// (que não roda JS) não consome o token de uso único antes da pessoa abrir.
export async function POST(request: Request) {
  const auth = await getRequestRole(request)
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }
  const { userId } = (body ?? {}) as { userId?: unknown }
  if (typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
  }

  const { data: userData, error: getErr } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (getErr || !userData.user?.email) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  // recovery serve tanto para quem nunca aceitou o convite quanto para quem esqueceu a senha.
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: userData.user.email,
  })
  if (error || !data.properties?.hashed_token) {
    return NextResponse.json({ error: 'Falha ao gerar o link' }, { status: 500 })
  }

  return NextResponse.json({ tokenHash: data.properties.hashed_token })
}
