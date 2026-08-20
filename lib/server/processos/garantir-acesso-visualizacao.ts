import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { usuarioTemVisualizacaoGabinete } from '@/lib/server/shared/grupo-processo';
import { usuarioTemPermissaoGrupoNoProcesso } from './usuario-tem-permissao-grupo';

type ProcessoComGrupos = {
  usuario_atribuido_id?: string | null;
  grupos?: { grupo: { id: string } }[];
};

/**
 * Porte do bloco de verificação de permissão repetido em
 * ProcessosService.buscarPorId e ProcessosService.buscarPorNumeroSei.
 */
export async function garantirAcessoVisualizacao(usuarioId: string, processo: ProcessoComGrupos): Promise<void> {
  const temVisualizacaoGabinete = await usuarioTemVisualizacaoGabinete(usuarioId);

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { unidade_id: true, permissao: true },
  });

  // Simplificação decidida pela usuária (2026-08-14): só DEV tem bypass de sistema.
  if (usuario && usuario.permissao !== 'DEV' && !temVisualizacaoGabinete) {
    const temPermissaoGrupo = await usuarioTemPermissaoGrupoNoProcesso(usuarioId, processo, 'visualizar');
    if (!temPermissaoGrupo) {
      throw new HttpError(403, 'Você não tem permissão de grupo para acessar este processo.');
    }
  }
}
