import { buscarTudo } from './buscar-tudo';

/** Porte de LogsService.buscarPorEntidade (Antares-backend/src/logs/logs.service.ts). */
export async function buscarPorEntidade(
  entidadeTipo: string,
  entidadeId: string,
  pagina?: number,
  limite?: number,
) {
  return buscarTudo(pagina, limite, { entidadeTipo, entidadeId });
}
