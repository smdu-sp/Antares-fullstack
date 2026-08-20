import { buscarTudo } from './buscar-tudo';

/** Porte de LogsService.buscarPorUsuario (Antares-backend/src/logs/logs.service.ts). */
export async function buscarPorUsuario(usuario_id: string, pagina?: number, limite?: number) {
  return buscarTudo(pagina, limite, { usuario_id });
}
