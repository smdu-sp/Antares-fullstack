import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requirePermissao } from '@/lib/server/auth/permissao';
import { criar } from '@/lib/server/processos/criar';
import { buscarTudo } from '@/lib/server/processos/buscar-tudo';
import { createProcessoSchema } from '@/lib/server/validation/processos.schema';

export const runtime = 'nodejs';

/** Porte de ProcessosController.criar (POST /processos). */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requirePermissao(usuario.id, 'processo.modificar', request.headers.get('x-grupo-ativo-id'));

    const body = await request.json();
    const dados = createProcessoSchema.parse(body);
    const processo = await criar(dados, usuario.id);

    return jsonResponse(processo, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de ProcessosController.buscarTudo (GET /processos). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requirePermissao(usuario.id, 'processo.visualizar', request.headers.get('x-grupo-ativo-id'));

    const { searchParams } = new URL(request.url);
    const pagina = Number(searchParams.get('pagina')) || undefined;
    const limite = Number(searchParams.get('limite')) || undefined;
    const busca = searchParams.get('busca') || undefined;
    const interessado = searchParams.get('interessado') || undefined;
    const unidadeRemetente = searchParams.get('unidadeRemetente') || undefined;
    const unidadeDestino = searchParams.get('unidadeDestino') || undefined;
    const unidade = searchParams.get('unidade') || undefined;
    const vencendoHoje = searchParams.get('vencendoHoje') === 'true';
    const atrasados = searchParams.get('atrasados') === 'true';
    const concluidos = searchParams.get('concluidos') === 'true';

    const resultado = await buscarTudo(
      pagina,
      limite,
      busca,
      interessado,
      unidadeRemetente,
      unidadeDestino,
      vencendoHoje,
      atrasados,
      concluidos,
      usuario.id,
      unidade,
    );

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
