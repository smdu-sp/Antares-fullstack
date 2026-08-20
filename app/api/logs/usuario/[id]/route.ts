import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { buscarPorUsuario } from '@/lib/server/logs/buscar-por-usuario';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de LogsController.buscarPorUsuario (GET /logs/usuario/:id). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV', 'ADM']);

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const pagina = Number(searchParams.get('pagina')) || undefined;
    const limite = Number(searchParams.get('limite')) || undefined;

    const resultado = await buscarPorUsuario(id, pagina, limite);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
