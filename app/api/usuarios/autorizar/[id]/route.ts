import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { autorizar } from '@/lib/server/usuarios/autorizar';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de UsuariosController.autorizarUsuario (PATCH /usuarios/autorizar/:id). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { id } = await params;
    const resultado = await autorizar(id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
