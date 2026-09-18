import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { buscarPorId } from '@/lib/server/unidades-grupo/buscar-por-id';
import { atualizar } from '@/lib/server/unidades-grupo/atualizar';
import { remover } from '@/lib/server/unidades-grupo/remover';
import { updateUnidadeGrupoSchema } from '@/lib/server/validation/unidades-grupo.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Espelha GET /unidades/:id. */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);

    const { id } = await params;
    const unidade = await buscarPorId(id);

    return jsonResponse(unidade);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Espelha PATCH /unidades/:id. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { id } = await params;
    const body = await request.json();
    const dados = updateUnidadeGrupoSchema.parse(body);
    const unidade = await atualizar(id, dados);

    return jsonResponse(unidade);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Espelha DELETE /unidades/:id. */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { id } = await params;
    const resultado = await remover(id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
