import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { buscarPorId } from '@/lib/server/usuarios/buscar-por-id';

export const runtime = 'nodejs';

/** Porte de AuthController.usuarioAtual (GET /usuario-atual). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    const resultado = await buscarPorId(usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
