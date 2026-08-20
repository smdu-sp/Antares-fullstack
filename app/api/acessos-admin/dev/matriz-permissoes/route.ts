import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { obterMatrizPermissoesEfetivas } from '@/lib/server/acessos-admin/obter-matriz-permissoes-efetivas';

export const runtime = 'nodejs';

/** Porte de AcessosAdminController.obterMatrizPermissoesEfetivas (GET /acessos-admin/dev/matriz-permissoes). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const usuarioId = new URL(request.url).searchParams.get('usuarioId') || undefined;
    const resultado = await obterMatrizPermissoesEfetivas(usuarioId);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
