import { ZodError } from 'zod';
import { jsonResponse } from './json-response';
import { AuthError } from '@/lib/server/auth/errors';
import { HttpError } from '@/lib/server/http-error';

const STATUS_LABEL: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
};

/**
 * Converte erros lançados pela camada de negócio/auth no mesmo formato que o
 * filtro de exceções padrão do NestJS retornava ({statusCode, message, error}),
 * já que o frontend lê `data?.message`/`data?.statusCode` das respostas de erro.
 */
export function handleRouteError(error: unknown) {
  if (error instanceof AuthError || error instanceof HttpError) {
    return jsonResponse(
      { statusCode: error.status, message: error.message, error: STATUS_LABEL[error.status] ?? 'Error' },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? 'Dados inválidos.';
    return jsonResponse({ statusCode: 400, message, error: 'Bad Request' }, { status: 400 });
  }

  console.error(error);
  return jsonResponse({ statusCode: 500, message: 'Erro interno.', error: 'Internal Server Error' }, { status: 500 });
}
