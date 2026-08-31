import { TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { criar as criarLog } from '@/lib/server/logs/criar';
import { validarUsuario, validarGrupo } from './validadores';

/**
 * Substitui a antiga atualização por colunas boolean fixas por um modelo de linhas
 * em UsuarioPermissoes. `grupoId` nulo grava uma concessão global (independente do
 * grupo ativo); `grupoId` preenchido escopa a concessão a esse vínculo
 * usuário-grupo específico — mesmo grão de configuração que o painel DEV já usava
 * antes, só que agora extensível sem migração de banco.
 *
 * `codigos` é a lista completa de permissões desejadas para este (usuario, grupo):
 * o que já estava ativo e não está na lista é desativado; o que está na lista e
 * não existia é criado. find-then-create em vez de upsert pelo índice composto —
 * MySQL trata `grupo_id IS NULL` como distinto em índice único, então confiar no
 * upsert nativo poderia duplicar linhas de concessão global.
 */
export async function atualizarPermissoesUsuario(
  usuarioId: string,
  grupoId: string | null,
  codigos: string[],
  operadorId: string,
) {
  await validarUsuario(usuarioId);
  if (grupoId) await validarGrupo(grupoId);

  const atuais = await prisma.usuarioPermissoes.findMany({
    where: { usuario_id: usuarioId, grupo_id: grupoId, ativo: true },
    include: { permissao: { select: { id: true, codigo: true } } },
  });

  const codigosAtuais = new Set(atuais.map((item) => item.permissao.codigo));
  const codigosDesejados = new Set(codigos);

  const codigosParaAtivar = codigos.filter((codigo) => !codigosAtuais.has(codigo));
  const itensParaDesativar = atuais.filter((item) => !codigosDesejados.has(item.permissao.codigo));

  const permissoesParaAtivar = codigosParaAtivar.length
    ? await prisma.permissoes.findMany({ where: { codigo: { in: codigosParaAtivar }, ativo: true } })
    : [];

  for (const permissao of permissoesParaAtivar) {
    const existente = await prisma.usuarioPermissoes.findFirst({
      where: { usuario_id: usuarioId, grupo_id: grupoId, permissao_id: permissao.id },
      select: { id: true },
    });

    if (existente) {
      await prisma.usuarioPermissoes.update({ where: { id: existente.id }, data: { ativo: true } });
    } else {
      await prisma.usuarioPermissoes.create({
        data: { usuario_id: usuarioId, grupo_id: grupoId, permissao_id: permissao.id, ativo: true },
      });
    }
  }

  for (const item of itensParaDesativar) {
    await prisma.usuarioPermissoes.update({ where: { id: item.id }, data: { ativo: false } });
  }

  const resultado = await prisma.usuarioPermissoes.findMany({
    where: { usuario_id: usuarioId, grupo_id: grupoId, ativo: true },
    include: { permissao: { select: { codigo: true, descricao: true } } },
  });

  await criarLog(
    TipoAcao.USUARIO_PERMISSAO_ATUALIZADA,
    `Permissões de usuário atualizadas: usuario=${usuarioId}, grupo=${grupoId ?? 'global'}`,
    'usuario_permissoes',
    usuarioId,
    operadorId,
    { codigos: Array.from(codigosAtuais) },
    { codigos },
  );

  return resultado;
}
