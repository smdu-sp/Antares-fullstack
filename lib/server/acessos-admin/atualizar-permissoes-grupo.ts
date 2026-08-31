import { PermissaoGrupo, TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { criar as criarLog } from '@/lib/server/logs/criar';
import { validarGrupo } from './validadores';

/**
 * Análogo a atualizarPermissoesUsuario, mas grava o baseline do grupo por papel
 * (GrupoPermissoes) — permissões que se estendem a qualquer usuário cujo grupo
 * ativo seja este E cujo papel nesse grupo seja `papel`, sem precisar de
 * concessão individual (ver usuarioTemPermissao em lib/server/auth/resolver-permissoes.ts).
 *
 * `codigos` é a lista completa de permissões desejadas para este (grupo, papel):
 * o que já estava ativo e não está na lista é desativado; o que está na lista e
 * não existia é criado. find-then-create em vez de upsert pelo índice composto,
 * pelo mesmo motivo do análogo de usuário.
 */
export async function atualizarPermissoesGrupo(
  grupoId: string,
  papel: PermissaoGrupo,
  codigos: string[],
  operadorId: string,
) {
  await validarGrupo(grupoId);

  const atuais = await prisma.grupoPermissoes.findMany({
    where: { grupo_id: grupoId, papel, ativo: true },
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
    const existente = await prisma.grupoPermissoes.findFirst({
      where: { grupo_id: grupoId, papel, permissao_id: permissao.id },
      select: { id: true },
    });

    if (existente) {
      await prisma.grupoPermissoes.update({ where: { id: existente.id }, data: { ativo: true } });
    } else {
      await prisma.grupoPermissoes.create({
        data: { grupo_id: grupoId, papel, permissao_id: permissao.id, ativo: true },
      });
    }
  }

  for (const item of itensParaDesativar) {
    await prisma.grupoPermissoes.update({ where: { id: item.id }, data: { ativo: false } });
  }

  const resultado = await prisma.grupoPermissoes.findMany({
    where: { grupo_id: grupoId, papel, ativo: true },
    include: { permissao: { select: { codigo: true, descricao: true } } },
  });

  await criarLog(
    TipoAcao.GRUPO_ATUALIZADO,
    `Permissões de grupo atualizadas: grupo=${grupoId}, papel=${papel}`,
    'grupo_permissoes',
    grupoId,
    operadorId,
    { codigos: Array.from(codigosAtuais) },
    { codigos },
  );

  return resultado;
}
