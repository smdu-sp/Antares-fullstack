import type { TipoAcao } from '@prisma/client';
import { buscarTudo } from './buscar-tudo';

/** Porte de LogsService.buscarPorTipoAcao (Antares-backend/src/logs/logs.service.ts). */
export async function buscarPorTipoAcao(tipoAcao: TipoAcao, pagina?: number, limite?: number) {
  return buscarTudo(pagina, limite, { tipoAcao });
}
