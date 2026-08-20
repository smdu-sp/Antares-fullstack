import { HttpError } from '@/lib/server/http-error';
import { buscarPorId } from './buscar-por-id';
import { garantirPermissaoProcesso } from './permissoes';
import { atualizar } from './atualizar';

/** Porte de AndamentosService.prorrogar (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function prorrogar(id: string, novaDataLimite: string, usuario_id: string) {
  const andamento = await buscarPorId(id, usuario_id);
  await garantirPermissaoProcesso(usuario_id, andamento.processo_id, 'modificar');

  const novaData = new Date(novaDataLimite);
  const dataAtual = new Date();

  if (novaData <= dataAtual) throw new HttpError(400, 'A nova data limite deve ser futura.');

  // `status` não é lido por atualizar() — é sempre derivado de prorrogacao/resposta.
  return atualizar(id, { prorrogacao: novaDataLimite }, usuario_id);
}
