import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { semearGruposPadrao } from '@/lib/server/acessos-admin/semear-grupos-padrao';

export const runtime = 'nodejs';

/** Porte de AcessosAdminController.semearGruposPadrao (POST /acessos-admin/dev/grupos/semeadura-padrao). */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const resultado = await semearGruposPadrao(usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
