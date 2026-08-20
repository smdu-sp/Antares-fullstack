import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { obterGrupoAtivo } from '@/lib/server/auth/obter-grupo-ativo';
import { definirGrupoAtivo } from '@/lib/server/auth/definir-grupo-ativo';
import { definirGrupoAtivoSchema } from '@/lib/server/validation/auth.schema';

export const runtime = 'nodejs';

/** Porte de AuthController.obterGrupoAtivo (GET /grupo-ativo). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    const resultado = await obterGrupoAtivo(usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de AuthController.definirGrupoAtivo (PATCH /grupo-ativo). */
export async function PATCH(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);

    const body = await request.json();
    const dados = definirGrupoAtivoSchema.parse(body);
    const resultado = await definirGrupoAtivo(usuario.id, dados.grupoId);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
