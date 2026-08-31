import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';
import { PROCESSO_INCLUDE_PADRAO } from './processo-include';
import { mapProcessoToResponseDto } from './map-processo-response';
import { garantirAcessoVisualizacao } from './garantir-acesso-visualizacao';

/** Porte de ProcessosService.buscarPorNumeroSei (Antares-backend/src/processos/processos.service.ts). */
export async function buscarPorNumeroSei(numero_sei: string, usuario_id?: string) {
  if (!numero_sei) throw new HttpError(400, 'Número SEI é obrigatório.');

  // numero_sei não é mais único no sistema inteiro — cada grupo pode ter sua
  // própria cópia (ver criar.ts). Sem um usuário/grupo pra escopar a busca, não
  // há como saber qual cópia retornar.
  const grupoAtivoId = usuario_id ? await obterGrupoAtivoIdSimples(usuario_id) : null;
  if (!grupoAtivoId) throw new HttpError(404, 'Processo não encontrado.');

  const processo = await prisma.processo.findFirst({
    where: { numero_sei, grupo_id: grupoAtivoId },
    include: PROCESSO_INCLUDE_PADRAO,
  });
  if (!processo || !processo.ativo) throw new HttpError(404, 'Processo não encontrado.');

  if (usuario_id) {
    await garantirAcessoVisualizacao(usuario_id, processo);
  }

  return mapProcessoToResponseDto(processo);
}
