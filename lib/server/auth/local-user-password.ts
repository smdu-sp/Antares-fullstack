import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// Hash salgado (scrypt) pra validar a senha do usuário local único — aquele
// que autentica sem LDAP (ver USUARIO_LOCAL_LOGIN/USUARIO_LOCAL_SENHA_HASH em
// validate-credentials.ts). Node puro, sem depender de bcrypt/argon2 como
// dependência nova só pra essa única conta.
const KEYLEN = 64;

/** Gera o valor pra colocar em USUARIO_LOCAL_SENHA_HASH no .env. Formato "salt:hash", ambos hex. */
export function gerarHashSenhaLocal(senha: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(senha, salt, KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

/** Confere `senha` contra um hash gerado por gerarHashSenhaLocal. */
export function verificarSenhaLocal(senha: string, hashArmazenado: string): boolean {
  const [salt, hashHex] = hashArmazenado.split(':');
  if (!salt || !hashHex) return false;

  const hashEsperado = Buffer.from(hashHex, 'hex');
  const hashCalculado = scryptSync(senha, salt, hashEsperado.length || KEYLEN);

  if (hashCalculado.length !== hashEsperado.length) return false;
  return timingSafeEqual(hashCalculado, hashEsperado);
}
