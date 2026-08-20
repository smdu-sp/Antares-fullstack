import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { buscarPorId } from '@/lib/server/usuarios/buscar-por-id';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de UsuariosController.buscarPorId (GET /usuarios/buscar-por-id/:id). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM']);

    const { id } = await params;
    const resultado = await buscarPorId(id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
