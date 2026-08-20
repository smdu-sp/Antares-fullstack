import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { listarGruposProcesso } from '@/lib/server/acessos-admin/listar-grupos-processo';

export const runtime = 'nodejs';

type Params = { params: Promise<{ processoId: string }> };

/** Porte de AcessosAdminController.listarGruposProcesso (GET /acessos-admin/dev/processos/:processoId/grupos). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { processoId } = await params;
    const resultado = await listarGruposProcesso(processoId);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
