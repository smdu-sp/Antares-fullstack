import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { reativar } from '@/lib/server/unidades/reativar';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de UnidadesController.reativar (PATCH /unidades/:id/reativar). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM']);

    const { id } = await params;
    const unidade = await reativar(id);

    return jsonResponse(unidade);
  } catch (error) {
    return handleRouteError(error);
  }
}
