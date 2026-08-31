import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { listarPermissoes } from '@/lib/server/acessos-admin/listar-permissoes';

export const runtime = 'nodejs';

/** Catálogo de permissões ativas (GET /acessos-admin/dev/permissoes), para o painel DEV. */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const resultado = await listarPermissoes();

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
