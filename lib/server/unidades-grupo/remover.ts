import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { buscarPorId } from './buscar-por-id';

/**
 * Espelha lib/server/unidades/remover.ts, pra UnidadeGrupo — mas checa
 * unidade_destino_id (o único campo de processo que aponta pra essa tabela,
 * já que unidade_remetente_id foi removido — ver `origem`, texto livre),
 * diferente de `unidades/remover.ts` que checa usuarios.unidade_id e
 * processos.unidade_id (o catálogo global tem outro uso).
 */
export async function remover(id: string) {
  await buscarPorId(id);

  const processosVinculados = await prisma.processo.count({
    where: {
      ativo: true,
      unidade_destino_id: id,
    },
  });
  if (processosVinculados > 0) {
    throw new HttpError(
      400,
      `Não é possível remover a unidade pois existem ${processosVinculados} processo(s) ativo(s) relacionado(s). Remova ou altere a unidade dos processos primeiro.`,
    );
  }

  await prisma.unidadeGrupo.update({ where: { id }, data: { ativo: false } });
  return { removido: true };
}
