import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { atualizarPermissoesDev } from '@/lib/server/usuarios/atualizar-permissoes-dev';
import { atualizarPermissoesDevSchema } from '@/lib/server/validation/usuarios.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de UsuariosController.atualizarPermissoesDev (PATCH /usuarios/admin/dev/permissoes/:id). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { id } = await params;
    const body = await request.json();
    const dados = atualizarPermissoesDevSchema.parse(body);
    const resultado = await atualizarPermissoesDev(id, dados);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
