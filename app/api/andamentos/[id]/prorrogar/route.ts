import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requirePermissao } from '@/lib/server/auth/permissao';
import { prorrogar } from '@/lib/server/andamentos/prorrogar';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de AndamentosController.prorrogar (PATCH /andamentos/:id/prorrogar). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC']);
    await requirePermissao(usuario.id, 'andamento.modificar', request.headers.get('x-grupo-ativo-id'));

    const { id } = await params;
    const body = await request.json();
    const novaDataLimite = body?.novaDataLimite;
    if (typeof novaDataLimite !== 'string' || !novaDataLimite) {
      return jsonResponse(
        { statusCode: 400, message: 'novaDataLimite é obrigatório.', error: 'Bad Request' },
        { status: 400 },
      );
    }

    const resultado = await prorrogar(id, novaDataLimite, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
