import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requirePermissao } from '@/lib/server/auth/permissao';
import { contarVencidos } from '@/lib/server/andamentos/contar-vencidos';

export const runtime = 'nodejs';

/** Porte de AndamentosController.contarVencidos (GET /andamentos/contar/vencidos). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requirePermissao(usuario.id, 'andamento.visualizar', request.headers.get('x-grupo-ativo-id'));

    const total = await contarVencidos(usuario.id);

    return jsonResponse({ total });
  } catch (error) {
    return handleRouteError(error);
  }
}
