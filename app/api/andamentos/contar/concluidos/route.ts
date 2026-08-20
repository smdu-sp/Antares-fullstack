import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requireCapacidade } from '@/lib/server/auth/capacidade';
import { contarConcluidos } from '@/lib/server/andamentos/contar-concluidos';

export const runtime = 'nodejs';

/** Porte de AndamentosController.contarConcluidos (GET /andamentos/contar/concluidos). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requireCapacidade(usuario.id, 'andamento.visualizar', request.headers.get('x-grupo-ativo-id'));

    const total = await contarConcluidos(usuario.id);

    return jsonResponse({ total });
  } catch (error) {
    return handleRouteError(error);
  }
}
