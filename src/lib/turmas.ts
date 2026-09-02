// Lista fechada de turmas. O valor precisa bater exatamente com mentorados.turma —
// é comparado por igualdade de string na RLS que restringe o que cada mentor enxerga.
// Ao trocar o mentor de uma turma, renomeie o valor aqui E no banco (mentorados.turma
// e user_roles.turma) e registre o mentor anterior em TURMAS_HISTORICO.
export const TURMAS = ['Turma 1 - Rafa', 'Turma 2 - Rafa', 'Turma 3 - Henrique', 'Turma 4 - Ivens'] as const

export type Turma = (typeof TURMAS)[number]

// Mentores anteriores de cada turma, do mais antigo para o mais recente.
export const TURMAS_HISTORICO: Partial<Record<Turma, string[]>> = {
  'Turma 3 - Henrique': ['Carlos'], // Carlos foi o mentor até set/2026
}

// Rótulo para exibir em selects/listas, com o histórico de mentores quando houver.
export function turmaLabel(turma: string): string {
  const anteriores = TURMAS_HISTORICO[turma as Turma]
  return anteriores?.length ? `${turma} (antes: ${anteriores.join(', ')})` : turma
}
