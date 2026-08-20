import { StatusAndamento } from '@prisma/client';
import { HttpError } from '@/lib/server/http-error';
import { buscarPorId } from './buscar-por-id';
import { garantirPermissaoProcesso } from './permissoes';
import { atualizar } from './atualizar';

/** Porte de AndamentosService.concluir (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function concluir(id: string, usuario_id: string) {
  const andamento = await buscarPorId(id, usuario_id);
  await garantirPermissaoProcesso(usuario_id, andamento.processo_id, 'modificar');

  if (andamento.status === StatusAndamento.CONCLUIDO) {
    throw new HttpError(400, 'Andamento já está concluído.');
  }

  // `status` não é lido por atualizar() — é sempre derivado de prorrogacao/resposta,
  // omitido aqui de propósito (o service original também o ignora nesse ponto).
  return atualizar(id, { resposta: new Date().toISOString() }, usuario_id);
}
