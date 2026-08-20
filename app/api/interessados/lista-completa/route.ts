import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { listaCompleta } from '@/lib/server/interessados/lista-completa';

export const runtime = 'nodejs';

/** Porte de InteressadosController.listaCompleta (GET /interessados/lista-completa). */
export async function GET(request: Request) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);

    const interessados = await listaCompleta();

    return jsonResponse(interessados);
  } catch (error) {
    return handleRouteError(error);
  }
}
