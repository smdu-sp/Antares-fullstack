/** Porte de mapProcessoToResponseDto (Antares-backend/src/processos/processos.service.ts). */
export function mapProcessoToResponseDto<T extends { prorrogacao: Date | null }>(
  processo: T,
): T & { data_prorrogacao: Date | null } {
  return { ...processo, data_prorrogacao: processo.prorrogacao };
}
