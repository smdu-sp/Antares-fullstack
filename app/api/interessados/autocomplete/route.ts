import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { listaCompleta } from '@/lib/server/interessados/lista-completa';
import { buscarPorTermo } from '@/lib/server/interessados/buscar-por-termo';

export const runtime = 'nodejs';

/** Porte de InteressadosController.autocomplete (GET /interessados/autocomplete). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);

    const termo = new URL(request.url).searchParams.get('termo')?.trim();

    if (!termo || termo.length < 2) {
      return jsonResponse(await listaCompleta());
    }

    return jsonResponse(await buscarPorTermo(termo));
  } catch (error) {
    return handleRouteError(error);
  }
}
