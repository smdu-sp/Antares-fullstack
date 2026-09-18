import { prisma } from '@/lib/prisma';
import { hashValorInteressado } from '@/lib/server/interessados/hash-valor';

/**
 * Achar-ou-criar de Interessado a partir de texto livre digitado (sem
 * sugestão/dropdown na grid — ver components/processos-spreadsheet.tsx),
 * escopado ao grupo do processo. Reaproveitado por criar.ts e atualizar.ts.
 */
export async function resolverInteressadoPorTexto(texto: string, grupoId: string): Promise<string> {
  const valor = texto.trim();

  const existente = await prisma.interessado.findFirst({
    where: { valor, ativo: true, grupo_id: grupoId },
  });
  if (existente) return existente.id;

  const criado = await prisma.interessado.create({
    data: { valor, valorHash: hashValorInteressado(valor), grupo_id: grupoId },
  });
  return criado.id;
}

/**
 * Achar-ou-criar de UnidadeGrupo (unidade remetente/destino de processo) a
 * partir de texto livre digitado, escopado ao grupo do processo. Antes disso
 * a ausência de match bloqueava com erro "não encontrada" — como não sobrou
 * dropdown pra oferecer um botão "Criar: ...", passou a criar automaticamente
 * (mesmo comportamento que Interessado já tinha).
 */
export async function resolverUnidadeGrupoPorTexto(texto: string, grupoId: string): Promise<string> {
  const valorBruto = texto.trim();

  // Compatibilidade com o formato antigo "SIGLA - Nome" (não é mais sugerido
  // já que não sobrou dropdown, mas segue aceito se digitado assim). Sem esse
  // separador, o texto inteiro vira `nome` e a sigla é derivada dele.
  let nome = valorBruto;
  let siglaDigitada: string | null = null;
  if (valorBruto.includes(' - ')) {
    const [siglaParte, ...resto] = valorBruto.split(' - ');
    siglaDigitada = siglaParte.trim().toUpperCase();
    nome = resto.join(' - ').trim() || siglaDigitada;
  }

  // Sigla é única por grupo — se bater, é a mesma unidade independente do
  // nome digitado agora (não dá pra existir uma segunda linha com a mesma
  // sigla mesmo assim). Sem sigla digitada, cai pra achar por nome.
  const existente = await prisma.unidadeGrupo.findFirst({
    where: {
      grupo_id: grupoId,
      ativo: true,
      ...(siglaDigitada ? { sigla: siglaDigitada } : { nome }),
    },
  });
  if (existente) return existente.id;

  const sigla = siglaDigitada || (await gerarSiglaUnica(nome, grupoId));

  const criado = await prisma.unidadeGrupo.create({ data: { nome, sigla, grupo_id: grupoId } });
  return criado.id;
}

/**
 * Deriva uma sigla a partir do nome (iniciais de cada palavra, ou os 3
 * primeiros caracteres se for uma palavra só) e garante que não colide com
 * nenhuma sigla já usada no grupo — acrescenta um sufixo numérico até achar
 * uma livre. Sem isso, nomes parecidos (ex.: "Unidade Remetente X" e
 * "Unidade Destino X") derivariam pra sigla igual e a criação quebraria no
 * índice único (sigla, grupo_id).
 */
async function gerarSiglaUnica(nome: string, grupoId: string): Promise<string> {
  const palavras = nome.split(/\s+/).filter(Boolean);
  const base =
    (palavras.length > 1 ? palavras.map((p) => p[0]).join('') : nome.slice(0, 3))
      .toUpperCase()
      .slice(0, 10) || 'UN';

  let candidata = base;
  let tentativa = 1;
  while (true) {
    const emUso = await prisma.unidadeGrupo.findFirst({
      where: { sigla: candidata, grupo_id: grupoId },
      select: { id: true },
    });
    if (!emUso) return candidata;
    tentativa += 1;
    candidata = `${base}${tentativa}`;
  }
}
