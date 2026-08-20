import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { buscarTecnicos } from '@/lib/server/usuarios/buscar-tecnicos';

export const runtime = 'nodejs';

/** Porte de UsuariosController.buscarTecnicos (GET /usuarios/buscar-tecnicos). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM']);

    const resultado = await buscarTecnicos();

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
