'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Destino do link de convite (e de recuperação de senha) do Supabase. O supabase-js
// lê os tokens do hash da URL e abre a sessão; aqui a pessoa só define a senha.
export default function DefinirSenhaPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'carregando' | 'pronto' | 'invalido'>('carregando')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const abrir = async () => {
      // Link gerado pelo admin em /usuarios (?token_hash=...): valida aqui, via JS,
      // para o preview de link do WhatsApp não gastar o token de uso único.
      const params = new URLSearchParams(window.location.search)
      const tokenHash = params.get('token_hash')
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        window.history.replaceState(null, '', window.location.pathname)
        if (error) {
          setStatus('invalido')
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setEmail(session.user.email ?? '')
        setStatus('pronto')
      } else {
        // Link expirado/já usado: o Supabase devolve error=... no hash e nenhuma sessão.
        setStatus('invalido')
      }
    }
    abrir()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (senha.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres')
      return
    }
    if (senha !== confirma) {
      setError('As senhas não conferem')
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSaving(false)

    if (error) {
      setError('Não foi possível salvar a senha. Tente de novo.')
      return
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src="/logo-apruma.png" alt="Apruma" className="h-16 object-contain" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {status === 'carregando' && (
            <p className="text-sm text-gray-400 text-center">Carregando...</p>
          )}

          {status === 'invalido' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Link inválido</h1>
              <p className="text-sm text-gray-400 text-center">
                Este link expirou ou já foi usado. Peça um novo convite para o administrador.
              </p>
            </>
          )}

          {status === 'pronto' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Crie sua senha</h1>
              <p className="text-sm text-gray-400 text-center mb-6">{email}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nova senha</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Mínimo de 8 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirme a senha</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirma}
                    onChange={(e) => setConfirma(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-colors"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-500">
                  <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                  Mostrar senha
                </label>

                {error && (
                  <div className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5 text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 text-white font-medium bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  {saving ? 'Salvando...' : 'Salvar e entrar'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
