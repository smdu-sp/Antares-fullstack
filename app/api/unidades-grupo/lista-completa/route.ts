import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { listaCompleta } from '@/lib/server/unidades-grupo/lista-completa';

export const runtime = 'nodejs';

/** Espelha GET /unidades/lista-completa — unidades do grupo ativo, abertas a todos (grid/autocomplete). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') !== 'false';

    const unidades = await listaCompleta(usuario.id, includeInactive);

    return jsonResponse(unidades);
  } catch (error) {
    return handleRouteError(error);
  }
}
