import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { atualizarPermissoesUsuario } from '@/lib/server/acessos-admin/atualizar-permissoes-usuario';
import { atualizarPermissoesUsuarioSchema } from '@/lib/server/validation/acessos-admin.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ usuarioId: string; grupoId: string }> };

/** Define a lista completa de permissões do usuário escopadas a este vínculo de grupo. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { usuarioId, grupoId } = await params;
    const body = await request.json();
    const dados = atualizarPermissoesUsuarioSchema.parse(body);
    const resultado = await atualizarPermissoesUsuario(usuarioId, grupoId, dados.codigos, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
