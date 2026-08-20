import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { listaCompleta } from '@/lib/server/usuarios/lista-completa';

export const runtime = 'nodejs';

/** Porte de UsuariosController.listaCompleta (GET /usuarios/lista-completa). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM']);

    const resultado = await listaCompleta();

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
