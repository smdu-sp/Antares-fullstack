import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { excluir } from '@/lib/server/usuarios/excluir';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de UsuariosController.excluir (DELETE /usuarios/desativar/:id). */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { id } = await params;
    const resultado = await excluir(id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
