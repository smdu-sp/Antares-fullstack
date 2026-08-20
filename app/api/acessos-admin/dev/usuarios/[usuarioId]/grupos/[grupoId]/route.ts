import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { vincularUsuarioGrupo } from '@/lib/server/acessos-admin/vincular-usuario-grupo';
import { vincularUsuarioGrupoSchema } from '@/lib/server/validation/acessos-admin.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ usuarioId: string; grupoId: string }> };

/** Porte de AcessosAdminController.vincularUsuarioGrupo (PATCH /acessos-admin/dev/usuarios/:usuarioId/grupos/:grupoId). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { usuarioId, grupoId } = await params;
    const body = await request.json();
    const dados = vincularUsuarioGrupoSchema.parse(body);
    const resultado = await vincularUsuarioGrupo(usuarioId, grupoId, dados, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
