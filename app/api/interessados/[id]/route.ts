import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { buscarPorId } from '@/lib/server/interessados/buscar-por-id';
import { atualizar } from '@/lib/server/interessados/atualizar';
import { remover } from '@/lib/server/interessados/remover';
import { updateInteressadoSchema } from '@/lib/server/validation/interessados.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de InteressadosController.buscarPorId (GET /interessados/:id). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);

    const { id } = await params;
    const interessado = await buscarPorId(id);

    return jsonResponse(interessado);
  } catch (error) {
    return handleRouteError(error);
  }
}

async function atualizarHandler(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { id } = await params;
    const body = await request.json();
    const dados = updateInteressadoSchema.parse(body);
    const interessado = await atualizar(id, dados);

    return jsonResponse(interessado);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de InteressadosController.atualizar (PATCH /interessados/:id). */
export const PATCH = atualizarHandler;
/** Porte de InteressadosController.atualizarPut (PUT /interessados/:id) — mesma lógica do PATCH no backend original. */
export const PUT = atualizarHandler;

/** Porte de InteressadosController.remover (DELETE /interessados/:id). */
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
