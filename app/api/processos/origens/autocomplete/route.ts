import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { autocompleteOrigens } from '@/lib/server/processos/autocomplete-origens';

export const runtime = 'nodejs';

/** Porte de ProcessosController.autocompleteOrigens (GET /processos/origens/autocomplete). */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const q = new URL(request.url).searchParams.get('q') || '';
    const resultado = await autocompleteOrigens(q);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
