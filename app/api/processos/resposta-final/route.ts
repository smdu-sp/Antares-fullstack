import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissao } from '@/lib/server/auth/permissao';
import { criarRespostaFinal } from '@/lib/server/processos/criar-resposta-final';
import { createRespostaFinalSchema } from '@/lib/server/validation/processos.schema';

export const runtime = 'nodejs';

/** Porte de ProcessosController.criarRespostaFinal (POST /processos/resposta-final). */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    // Rota original não tem @Permissoes, só @RequerCapacidade('processo.modificar').
    await requirePermissao(usuario.id, 'processo.modificar', request.headers.get('x-grupo-ativo-id'));

    const body = await request.json();
    const dados = createRespostaFinalSchema.parse(body);
    const resultado = await criarRespostaFinal(dados, usuario.id);

    return jsonResponse(resultado, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
