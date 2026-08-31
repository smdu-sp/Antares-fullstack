import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requirePermissao } from '@/lib/server/auth/permissao';
import { concluir } from '@/lib/server/andamentos/concluir';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de AndamentosController.concluir (PATCH /andamentos/:id/concluir). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC']);
    await requirePermissao(usuario.id, 'andamento.modificar', request.headers.get('x-grupo-ativo-id'));

    const { id } = await params;
    const resultado = await concluir(id, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
