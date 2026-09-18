import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { reativar } from '@/lib/server/unidades-grupo/reativar';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Espelha PATCH /unidades/:id/reativar. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    // Parte do fluxo de criação inline de unidade pela grid (reativa uma
    // unidade inativa com o mesmo nome/sigla no grupo ativo) — mesmo motivo
    // do POST /unidades-grupo. Ver components/unidade-autocomplete-editor.tsx.
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);

    const { id } = await params;
    const unidade = await reativar(id);

    return jsonResponse(unidade);
  } catch (error) {
    return handleRouteError(error);
  }
}
