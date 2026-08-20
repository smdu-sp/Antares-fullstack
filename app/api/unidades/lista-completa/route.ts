import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { listaCompleta } from '@/lib/server/unidades/lista-completa';

export const runtime = 'nodejs';

/** Porte de UnidadesController.listaCompleta (GET /unidades/lista-completa). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') !== 'false';

    const unidades = await listaCompleta(includeInactive);

    return jsonResponse(unidades);
  } catch (error) {
    return handleRouteError(error);
  }
}
