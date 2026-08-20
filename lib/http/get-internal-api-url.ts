/**
 * URL base same-origin para os Route Handlers internos (app/api/**) do
 * próprio Next.js — usada pelos módulos já migrados do backend NestJS.
 * Reaproveita AUTH_URL (já configurada para o NextAuth apontar para o
 * próprio app) em vez de introduzir uma env var nova.
 */
export function getInternalApiUrl(): string {
  if (typeof window !== 'undefined') return '/api/';
  const base = process.env.AUTH_URL || 'http://localhost:3001';
  return `${base.replace(/\/$/, '')}/api/`;
}
