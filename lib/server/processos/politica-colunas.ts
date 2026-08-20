import { GrupoCodigo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';

const CHAVE_ORDEM_COLUNAS_PROCESSOS = 'grid.processos.colunas.ordem';
const COLUNAS_FIXAS_PROCESSOS = ['selecao', 'expansao'];
const COLUNAS_PADRAO_EXPEDIENTE = [
  'numero_sei',
  'assunto',
  'origem',
  'interessado',
  'unidade_remetente',
  'unidade_destino',
  'data_recebimento',
  'data_envio_unidade',
  'prazo',
  'prorrogacao',
  'data_resposta_final',
  'observacoes',
];
const COLUNAS_PADRAO_SERVIN = ['numero_sei', 'assunto', 'origem', 'responsavel', 'prazo', 'observacoes'];
const COLUNAS_PADRAO_GABINETE = [
  'numero_sei',
  'assunto',
  'origem',
  'interessado',
  'unidade_remetente',
  'unidade_destino',
  'responsavel',
  'data_recebimento',
  'data_envio_unidade',
  'prazo',
  'prorrogacao',
  'data_resposta_final',
  'observacoes',
];

function obterColunasPadraoPorGrupo(codigoGrupo: GrupoCodigo): string[] {
  if (codigoGrupo === GrupoCodigo.SERVIN) return [...COLUNAS_PADRAO_SERVIN];
  if (codigoGrupo === GrupoCodigo.GABINETE) return [...COLUNAS_PADRAO_GABINETE];
  if (codigoGrupo === GrupoCodigo.GLOBAL) return [...COLUNAS_PADRAO_GABINETE];
  return [...COLUNAS_PADRAO_EXPEDIENTE];
}

function parseOrdemColunasPreferida(valor?: string | null): string[] {
  if (!valor) return [];

  try {
    const parsed = JSON.parse(valor);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === 'string');
  } catch {
    return valor
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}

function montarOrdemEfetivaColunas(ordemPadrao: string[], ordemUsuario: string[]): string[] {
  const colunasPermitidas = new Set(ordemPadrao);
  const ordemUsuarioFiltrada = ordemUsuario.filter((item) => colunasPermitidas.has(item));
  const usadas = new Set(ordemUsuarioFiltrada);

  return [...ordemUsuarioFiltrada, ...ordemPadrao.filter((item) => !usadas.has(item))];
}

/** Porte de ProcessosService.obterPoliticaColunasProcessos. */
export async function obterPoliticaColunasProcessos(usuarioId: string) {
  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);

  if (!grupoAtivoId) {
    throw new HttpError(400, 'Usuario nao possui grupo ativo para carregar politica de colunas.');
  }

  const vinculoAtivo = await prisma.usuarioGrupo.findFirst({
    where: { usuario_id: usuarioId, grupo_id: grupoAtivoId, ativo: true, grupo: { ativo: true } },
    select: { grupo: { select: { id: true, codigo: true, nome: true } } },
  });

  if (!vinculoAtivo) {
    throw new HttpError(400, 'Vinculo ativo do grupo selecionado nao foi encontrado para o usuario.');
  }

  const ordemPadrao = obterColunasPadraoPorGrupo(vinculoAtivo.grupo.codigo);
  const chaveGrupo = `${CHAVE_ORDEM_COLUNAS_PROCESSOS}.${vinculoAtivo.grupo.codigo.toLowerCase()}`;

  const [preferenciaGrupo, preferenciaGlobal] = await Promise.all([
    prisma.preferenciasUsuario.findUnique({
      where: { usuario_id_chave: { usuario_id: usuarioId, chave: chaveGrupo } },
      select: { valor: true, ativo: true },
    }),
    prisma.preferenciasUsuario.findUnique({
      where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_ORDEM_COLUNAS_PROCESSOS } },
      select: { valor: true, ativo: true },
    }),
  ]);

  const preferenciaValor =
    (preferenciaGrupo?.ativo && preferenciaGrupo.valor ? preferenciaGrupo.valor : null) ||
    (preferenciaGlobal?.ativo && preferenciaGlobal.valor ? preferenciaGlobal.valor : null);

  const ordemUsuario = parseOrdemColunasPreferida(preferenciaValor);
  const ordemEfetiva = montarOrdemEfetivaColunas(ordemPadrao, ordemUsuario);

  return {
    grupoAtivo: vinculoAtivo.grupo,
    chavePreferenciaOrdem: chaveGrupo,
    colunasFixas: COLUNAS_FIXAS_PROCESSOS,
    colunasDisponiveis: ordemPadrao,
    ordemPadrao,
    ordemUsuario,
    ordemEfetiva,
  };
}
