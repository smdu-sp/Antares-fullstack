import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { validaUsuario } from '@/lib/server/usuarios/valida-usuario';

export const runtime = 'nodejs';

/** Porte de UsuariosController.validaUsuario (GET /usuarios/valida-usuario). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    const resultado = await validaUsuario(usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
