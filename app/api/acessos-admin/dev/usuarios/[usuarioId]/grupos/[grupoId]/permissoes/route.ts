import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { atualizarPermissoesUsuarioGrupo } from '@/lib/server/acessos-admin/atualizar-permissoes-usuario-grupo';
import { atualizarPermissoesUsuarioGrupoSchema } from '@/lib/server/validation/acessos-admin.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ usuarioId: string; grupoId: string }> };

/** Porte de AcessosAdminController.atualizarPermissoesUsuarioGrupo (PATCH .../permissoes). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { usuarioId, grupoId } = await params;
    const body = await request.json();
    const dados = atualizarPermissoesUsuarioGrupoSchema.parse(body);
    const resultado = await atualizarPermissoesUsuarioGrupo(usuarioId, grupoId, dados, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
