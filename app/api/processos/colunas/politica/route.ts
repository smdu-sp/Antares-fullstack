import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requireCapacidade } from '@/lib/server/auth/capacidade';
import { obterPoliticaColunasProcessos } from '@/lib/server/processos/politica-colunas';

export const runtime = 'nodejs';

/** Porte de ProcessosController.obterPoliticaColunas (GET /processos/colunas/politica). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requireCapacidade(usuario.id, 'processo.visualizar', request.headers.get('x-grupo-ativo-id'));

    const resultado = await obterPoliticaColunasProcessos(usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
