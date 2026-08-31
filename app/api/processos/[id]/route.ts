import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requirePermissao } from '@/lib/server/auth/permissao';
import { buscarPorId } from '@/lib/server/processos/buscar-por-id';
import { atualizar } from '@/lib/server/processos/atualizar';
import { remover } from '@/lib/server/processos/remover';
import { updateProcessoSchema } from '@/lib/server/validation/processos.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de ProcessosController.buscarPorId (GET /processos/:id). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requirePermissao(usuario.id, 'processo.visualizar', request.headers.get('x-grupo-ativo-id'));

    const { id } = await params;
    const resultado = await buscarPorId(id, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de ProcessosController.atualizar (PATCH /processos/:id). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requirePermissao(usuario.id, 'processo.modificar', request.headers.get('x-grupo-ativo-id'));

    const { id } = await params;
    const body = await request.json();
    const dados = updateProcessoSchema.parse(body);
    const resultado = await atualizar(id, dados, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de ProcessosController.remover (DELETE /processos/:id). */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requirePermissao(usuario.id, 'processo.excluir', request.headers.get('x-grupo-ativo-id'));

    const { id } = await params;
    const resultado = await remover(id, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
