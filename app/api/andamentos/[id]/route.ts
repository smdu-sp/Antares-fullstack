import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requirePermissao } from '@/lib/server/auth/permissao';
import { buscarPorId } from '@/lib/server/andamentos/buscar-por-id';
import { atualizar } from '@/lib/server/andamentos/atualizar';
import { remover } from '@/lib/server/andamentos/remover';
import { updateAndamentoSchema } from '@/lib/server/validation/andamentos.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de AndamentosController.buscarPorId (GET /andamentos/:id). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requirePermissao(usuario.id, 'andamento.visualizar', request.headers.get('x-grupo-ativo-id'));

    const { id } = await params;
    const resultado = await buscarPorId(id, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de AndamentosController.atualizar (PATCH /andamentos/:id). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC']);
    await requirePermissao(usuario.id, 'andamento.modificar', request.headers.get('x-grupo-ativo-id'));

    const { id } = await params;
    const body = await request.json();
    const dados = updateAndamentoSchema.parse(body);
    const resultado = await atualizar(id, dados, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de AndamentosController.remover (DELETE /andamentos/:id). */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV', 'ADM', 'TEC']);
    await requirePermissao(usuario.id, 'andamento.excluir', request.headers.get('x-grupo-ativo-id'));

    const { id } = await params;
    const resultado = await remover(id, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
