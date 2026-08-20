import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { criar } from '@/lib/server/interessados/criar';
import { createInteressadoSchema } from '@/lib/server/validation/interessados.schema';

export const runtime = 'nodejs';

/** Porte de InteressadosController.criar (POST /interessados). */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC']);

    const body = await request.json();
    const dados = createInteressadoSchema.parse(body);
    const interessado = await criar(dados);

    return jsonResponse(interessado, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
