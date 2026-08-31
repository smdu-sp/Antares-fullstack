import { prisma } from '@/lib/prisma';
import { usuarioEhMembroGabinete } from '@/lib/server/shared/grupo-processo';

export type EntidadePermissao = 'processo' | 'andamento';
export type AcaoPermissao = 'visualizar' | 'modificar' | 'excluir';

function codigoPermissao(entidade: EntidadePermissao, sufixo: string): string {
  return `${entidade}.${sufixo}`;
}

/**
 * Núcleo da autorização granular (substitui as antigas colunas boolean de
 * UsuarioGrupoPermissao). Precedência: DEV tem bypass incondicional; senão, uma
 * concessão em UsuarioPermissoes (escopada ao grupo ativo OU global, grupo_id nulo)
 * já é suficiente; na ausência de concessão individual, cai para o baseline do
 * papel do usuário (ADM/TEC/USR) no grupo ativo, em GrupoPermissoes. v1 é
 * grant-only — não existe revogação explícita, então a ordem entre concessão
 * escopada e global não importa para o resultado.
 *
 * `grupoAtivoId` deve vir de um resolver que já garante vínculo usuário-grupo ativo
 * (ex. obterGrupoAtivoIdSimples, resolverGrupoAtivoParaPermissao) — este módulo não
 * revalida a membership.
 */
export async function usuarioTemPermissao(
  usuarioId: string,
  codigo: string,
  grupoAtivoId: string | null,
): Promise<boolean> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { dev: true },
  });

  if (!usuario) return false;
  if (usuario.dev) return true;

  // Visão do Gabinete: ADM honorário no grupo atualmente selecionado (qualquer
  // grupo ativo real, com ou sem vínculo próprio), sem depender de GrupoPermissoes
  // configurado. Só chega aqui pra códigos processo.*/andamento.* (ver callers).
  if (grupoAtivoId && (await usuarioEhMembroGabinete(usuarioId))) {
    const grupoAlvoValido = await prisma.grupo.findFirst({
      where: { id: grupoAtivoId, ativo: true },
      select: { id: true },
    });
    if (grupoAlvoValido) return true;
  }

  const concessaoUsuario = await prisma.usuarioPermissoes.findFirst({
    where: {
      ativo: true,
      usuario_id: usuarioId,
      permissao: { codigo, ativo: true },
      OR: [{ grupo_id: null }, ...(grupoAtivoId ? [{ grupo_id: grupoAtivoId }] : [])],
    },
    select: { id: true },
  });

  if (concessaoUsuario) return true;
  if (!grupoAtivoId) return false;

  const vinculo = await prisma.usuarioGrupo.findFirst({
    where: { usuario_id: usuarioId, grupo_id: grupoAtivoId, ativo: true, grupo: { ativo: true } },
    select: { permissao_grupo: true },
  });

  if (!vinculo) return false;

  const baseline = await prisma.grupoPermissoes.findFirst({
    where: {
      ativo: true,
      grupo_id: grupoAtivoId,
      papel: vinculo.permissao_grupo,
      permissao: { codigo, ativo: true },
    },
    select: { id: true },
  });

  return !!baseline;
}

/**
 * Variante pura/síncrona da mesma regra de precedência, para telas que já
 * carregaram os códigos concedidos em lote (ex.: matriz de permissões do painel
 * DEV) e querem evitar N+1 queries repetindo usuarioTemPermissao por linha.
 */
export function permissaoConcedida(
  codigo: string,
  opts: { escopadas: string[]; globais: string[]; baseline: string[] },
): boolean {
  return opts.escopadas.includes(codigo) || opts.globais.includes(codigo) || opts.baseline.includes(codigo);
}

/**
 * Composição de alto nível equivalente à antiga `avaliarCapacidade`: resolve a ação
 * (visualizar/modificar/excluir) para os códigos `<entidade>.<acao>_grupo` /
 * `<entidade>.<acao>_proprios`, com o mesmo padrão de OR usado hoje. `proprio=true`
 * (padrão) reproduz o comportamento de checagem em nível de rota, onde não há um
 * registro específico para avaliar posse; passe `proprio=false` para checagens em
 * nível de registro quando o registro não pertence ao usuário (ver
 * `usuario_atribuido_id` em processo).
 */
export async function usuarioPodeNaEntidade(
  usuarioId: string,
  entidade: EntidadePermissao,
  acao: AcaoPermissao,
  grupoAtivoId: string | null,
  proprio: boolean = true,
): Promise<boolean> {
  if (acao === 'excluir') {
    return usuarioTemPermissao(usuarioId, codigoPermissao(entidade, 'excluir'), grupoAtivoId);
  }

  const podeGrupo = await usuarioTemPermissao(usuarioId, codigoPermissao(entidade, `${acao}_grupo`), grupoAtivoId);
  if (podeGrupo) return true;
  if (!proprio) return false;

  return usuarioTemPermissao(usuarioId, codigoPermissao(entidade, `${acao}_proprios`), grupoAtivoId);
}
