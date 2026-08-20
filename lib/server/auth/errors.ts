export class AuthError extends Error {
  status: 401 | 403;

  constructor(status: 401 | 403, message?: string) {
    super(message ?? (status === 401 ? 'Não autenticado.' : 'Acesso negado.'));
    this.name = 'AuthError';
    this.status = status;
  }
}
