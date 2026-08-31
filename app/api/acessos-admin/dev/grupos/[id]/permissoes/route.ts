import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { atualizarPermissoesGrupo } from '@/lib/server/acessos-admin/atualizar-permissoes-grupo';
import { atualizarPermissoesGrupoSchema } from '@/lib/server/validation/acessos-admin.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Define a lista completa de permissões concedidas como baseline a este grupo, para um papel. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { id } = await params;
    const body = await request.json();
    const dados = atualizarPermissoesGrupoSchema.parse(body);
    const resultado = await atualizarPermissoesGrupo(id, dados.papel, dados.codigos, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
