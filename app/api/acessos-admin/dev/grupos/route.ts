import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { listarGrupos } from '@/lib/server/acessos-admin/listar-grupos';
import { criarGrupo } from '@/lib/server/acessos-admin/criar-grupo';
import { createGrupoSchema } from '@/lib/server/validation/acessos-admin.schema';

export const runtime = 'nodejs';

/** Porte de AcessosAdminController.listarGrupos (GET /acessos-admin/dev/grupos). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const resultado = await listarGrupos();

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de AcessosAdminController.criarGrupo (POST /acessos-admin/dev/grupos). */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const body = await request.json();
    const dados = createGrupoSchema.parse(body);
    const resultado = await criarGrupo(dados, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
