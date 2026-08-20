import { HttpError } from '@/lib/server/http-error';
import type { BatchAndamentoInput } from '@/lib/server/validation/andamentos.schema';
import { remover } from './remover';
import { prorrogar } from './prorrogar';
import { concluir } from './concluir';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Porte de AndamentosService.lote (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function lote(dados: BatchAndamentoInput, usuario_id: string) {
  const { ids, operacao } = dados;
  const novaDataLimite = dados.novaDataLimite || dados.prazo;

  const erros: string[] = [];
  let processados = 0;

  if (!ids || !Array.isArray(ids)) {
    throw new HttpError(400, `Campo 'ids' deve ser um array. Recebido tipo: ${typeof ids}`);
  }
  if (ids.length === 0) {
    throw new HttpError(400, 'Array de IDs está vazio. Pelo menos um ID é necessário.');
  }
  if (!['excluir', 'prorrogar', 'concluir'].includes(operacao)) {
    throw new HttpError(400, `Operação inválida: ${operacao}. Use: excluir, prorrogar ou concluir.`);
  }
  if (operacao === 'prorrogar' && !novaDataLimite) {
    throw new HttpError(400, 'Nova data limite é obrigatória para prorrogação.');
  }

  for (const id of ids) {
    if (!id || typeof id !== 'string') {
      erros.push(`ID inválido (não é string): ${JSON.stringify(id)}`);
      continue;
    }

    if (!UUID_REGEX.test(id)) {
      erros.push(`ID inválido (formato UUID incorreto): ${id}`);
      continue;
    }

    try {
      switch (operacao) {
        case 'excluir':
          await remover(id, usuario_id);
          break;
        case 'prorrogar':
          await prorrogar(id, novaDataLimite as string, usuario_id);
          break;
        case 'concluir':
          await concluir(id, usuario_id);
          break;
      }
      processados++;
    } catch (error) {
      erros.push(
        `Erro ao processar ID ${id} na operação ${operacao}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  return { processados, erros };
}
