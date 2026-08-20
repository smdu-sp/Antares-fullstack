import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { vincularProcessoGrupo } from '@/lib/server/acessos-admin/vincular-processo-grupo';
import { vincularProcessoGrupoSchema } from '@/lib/server/validation/acessos-admin.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ processoId: string; grupoId: string }> };

/** Porte de AcessosAdminController.vincularProcessoGrupo (PATCH /acessos-admin/dev/processos/:processoId/grupos/:grupoId). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { processoId, grupoId } = await params;
    const body = await request.json();
    const dados = vincularProcessoGrupoSchema.parse(body);
    const resultado = await vincularProcessoGrupo(processoId, grupoId, dados, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
