import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { atualizarGrupo } from '@/lib/server/acessos-admin/atualizar-grupo';
import { desativarGrupo } from '@/lib/server/acessos-admin/desativar-grupo';
import { updateGrupoSchema } from '@/lib/server/validation/acessos-admin.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de AcessosAdminController.atualizarGrupo (PATCH /acessos-admin/dev/grupos/:id). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { id } = await params;
    const body = await request.json();
    const dados = updateGrupoSchema.parse(body);
    const resultado = await atualizarGrupo(id, dados, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de AcessosAdminController.desativarGrupo (DELETE /acessos-admin/dev/grupos/:id). */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { id } = await params;
    const resultado = await desativarGrupo(id, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
