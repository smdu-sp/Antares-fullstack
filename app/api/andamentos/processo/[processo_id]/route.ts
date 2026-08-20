import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requireCapacidade } from '@/lib/server/auth/capacidade';
import { buscarPorProcesso } from '@/lib/server/andamentos/buscar-por-processo';

export const runtime = 'nodejs';

type Params = { params: Promise<{ processo_id: string }> };

/** Porte de AndamentosController.buscarPorProcesso (GET /andamentos/processo/:processo_id). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requireCapacidade(usuario.id, 'andamento.visualizar', request.headers.get('x-grupo-ativo-id'));

    const { processo_id } = await params;
    const resultado = await buscarPorProcesso(processo_id, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
