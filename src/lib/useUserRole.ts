'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getViewAs, type ViewAs } from '@/lib/viewAs'

export type UserRole = 'admin' | 'gerente' | 'mentor'

type UserRoleData = {
  role: UserRole
  turma: string | null
  loading: boolean
  email: string
  name: string
  caps: string[]
  // Preenchido quando um admin está no modo "Ver como" outro usuário.
  viewingAs: ViewAs | null
}

export function useUserRole(): UserRoleData {
  const [data, setData] = useState<UserRoleData>({
    role: 'mentor',
    turma: null,
    loading: true,
    email: '',
    name: '',
    caps: [],
    viewingAs: null,
  })

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setData((prev) => ({ ...prev, loading: false }))
        return
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, turma, extra_caps')
        .eq('user_id', user.id)
        .single()

      const realRole = (roleData?.role as UserRole) || 'mentor'
      // Só admin pode usar o "Ver como"; pra qualquer outro papel o valor é ignorado.
      const viewAs = realRole === 'admin' ? getViewAs() : null
      if (viewAs) {
        setData({
          role: viewAs.role,
          turma: viewAs.turma,
          loading: false,
          email: viewAs.email,
          name: viewAs.nome,
          caps: viewAs.caps,
          viewingAs: viewAs,
        })
        return
      }

      setData({
        role: realRole,
        turma: roleData?.turma || null,
        loading: false,
        email: user.email || '',
        name: user.user_metadata?.display_name || '',
        caps: (roleData?.extra_caps as string[] | null) || [],
        viewingAs: null,
      })
    }

    fetch()
  }, [])

  return data
}
