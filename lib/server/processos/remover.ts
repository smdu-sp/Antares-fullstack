import { TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criar as criarLog } from '@/lib/server/logs/criar';
import { buscarPorId } from './buscar-por-id';
import { usuarioTemPermissaoGrupoNoProcesso } from './usuario-tem-permissao-grupo';

/** Porte de ProcessosService.remover (Antares-backend/src/processos/processos.service.ts). */
export async function remover(id: string, usuario_id: string) {
  const processo = await buscarPorId(id, usuario_id);

  const usuarioAtual = await prisma.usuario.findUnique({ where: { id: usuario_id }, select: { permissao: true } });

  const processoPermissao = await prisma.processo.findUnique({
    where: { id },
    select: {
      usuario_atribuido_id: true,
      grupos: { where: { ativo: true }, select: { grupo: { select: { id: true } } } },
    },
  });

  const temPermissaoGrupoExcluir =
    processoPermissao && usuarioAtual
      ? await usuarioTemPermissaoGrupoNoProcesso(usuario_id, processoPermissao, 'excluir')
      : false;

  // Simplificação decidida pela usuária (2026-08-14): só DEV tem bypass de sistema.
  if (usuarioAtual && usuarioAtual.permissao !== 'DEV' && !temPermissaoGrupoExcluir) {
    throw new HttpError(403, 'Você não tem permissão de grupo para excluir este processo.');
  }

  const andamentos = await prisma.andamento.findMany({ where: { processo_id: id, ativo: true } });
  if (andamentos.length > 0) {
    throw new HttpError(
      400,
      `Não é possível remover o processo pois existem ${andamentos.length} andamento(s) ativo(s) relacionado(s). Remova os andamentos primeiro.`,
    );
  }

  await prisma.processo.update({ where: { id }, data: { ativo: false } });

  await criarLog(
    TipoAcao.PROCESSO_REMOVIDO,
    `Processo removido: ${processo.numero_sei} - ${processo.assunto}`,
    'processo',
    id,
    usuario_id,
    { numero_sei: processo.numero_sei, assunto: processo.assunto },
    null,
  );

  return { removido: true };
}
