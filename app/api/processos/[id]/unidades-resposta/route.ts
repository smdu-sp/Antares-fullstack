import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { buscarUnidadesResposta } from '@/lib/server/processos/buscar-unidades-resposta';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de ProcessosController.buscarUnidadesResposta (GET /processos/:id/unidades-resposta). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAuth(request);

    const { id } = await params;
    const resultado = await buscarUnidadesResposta(id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
