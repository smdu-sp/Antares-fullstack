import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requirePermissao } from '@/lib/server/auth/permissao';
import { lote } from '@/lib/server/andamentos/lote';
import { batchAndamentoSchema } from '@/lib/server/validation/andamentos.schema';

export const runtime = 'nodejs';

/** Porte de AndamentosController.lote (PATCH /andamentos/lote). */
export async function PATCH(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC']);
    await requirePermissao(usuario.id, 'andamento.modificar', request.headers.get('x-grupo-ativo-id'));

    const body = await request.json();
    const dados = batchAndamentoSchema.parse(body);
    const resultado = await lote(dados, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
