import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { criar } from '@/lib/server/unidades-grupo/criar';
import { buscarTudo } from '@/lib/server/unidades-grupo/buscar-tudo';
import { createUnidadeGrupoSchema } from '@/lib/server/validation/unidades-grupo.schema';

export const runtime = 'nodejs';

/** Espelha POST /unidades — unidade remetente/destino de processo, escopada ao grupo ativo. */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    // Mesmo motivo do POST /unidades: não é exclusivo da página admin — a grid
    // de processos cria inline ao editar a célula (Origem/Remetente/Destino),
    // pra qualquer papel. Ver components/unidade-autocomplete-editor.tsx.
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);

    const body = await request.json();
    const dados = createUnidadeGrupoSchema.parse(body);
    const unidade = await criar(dados, usuario.id);

    return jsonResponse(unidade, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Espelha GET /unidades — listagem paginada do grupo ativo, usada pela página admin (/unidades). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { searchParams } = new URL(request.url);
    const pagina = Number(searchParams.get('pagina')) || undefined;
    const limite = Number(searchParams.get('limite')) || undefined;
    const busca = searchParams.get('busca') || undefined;

    const resultado = await buscarTudo(usuario.id, pagina, limite, busca);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
