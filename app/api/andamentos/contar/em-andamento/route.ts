import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requirePermissao } from '@/lib/server/auth/permissao';
import { contarEmAndamento } from '@/lib/server/andamentos/contar-em-andamento';

export const runtime = 'nodejs';

/** Porte de AndamentosController.contarEmAndamento (GET /andamentos/contar/em-andamento). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requirePermissao(usuario.id, 'andamento.visualizar', request.headers.get('x-grupo-ativo-id'));

    const total = await contarEmAndamento(usuario.id);

    return jsonResponse({ total });
  } catch (error) {
    return handleRouteError(error);
  }
}
