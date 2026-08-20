import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { listarGruposUsuario } from '@/lib/server/acessos-admin/listar-grupos-usuario';

export const runtime = 'nodejs';

type Params = { params: Promise<{ usuarioId: string }> };

/** Porte de AcessosAdminController.listarGruposUsuario (GET /acessos-admin/dev/usuarios/:usuarioId/grupos). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { usuarioId } = await params;
    const resultado = await listarGruposUsuario(usuarioId);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
