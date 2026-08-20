import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { salvar } from '@/lib/server/preferencias/salvar';
import { buscarTodas } from '@/lib/server/preferencias/buscar-todas';
import { deletarTodas } from '@/lib/server/preferencias/deletar-todas';
import { salvarPreferenciaSchema } from '@/lib/server/validation/preferencias.schema';

export const runtime = 'nodejs';

/** Porte de PreferenciasController.salvar (POST /preferencias). */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);

    const body = await request.json();
    const dados = salvarPreferenciaSchema.parse(body);
    const resultado = await salvar(usuario.id, dados);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de PreferenciasController.buscarTodas (GET /preferencias). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    const resultado = await buscarTodas(usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de PreferenciasController.deletarTodas (DELETE /preferencias). */
export async function DELETE(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    const resultado = await deletarTodas(usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
