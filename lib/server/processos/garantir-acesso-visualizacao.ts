import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { usuarioTemPermissaoGrupoNoProcesso } from './usuario-tem-permissao-grupo';

type ProcessoComGrupo = {
  usuario_atribuido_id?: string | null;
  grupo_id: string;
};

/**
 * Porte do bloco de verificação de permissão repetido em
 * ProcessosService.buscarPorId e ProcessosService.buscarPorNumeroSei.
 */
export async function garantirAcessoVisualizacao(usuarioId: string, processo: ProcessoComGrupo): Promise<void> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { unidade_id: true, dev: true },
  });

  if (usuario && !usuario.dev) {
    const temPermissaoGrupo = await usuarioTemPermissaoGrupoNoProcesso(usuarioId, processo, 'visualizar');
    if (!temPermissaoGrupo) {
      throw new HttpError(403, 'Você não tem permissão de grupo para acessar este processo.');
    }
  }
}
