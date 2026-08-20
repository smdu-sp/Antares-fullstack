import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { CHAVES_PREFERENCIA_RESERVADAS } from './chaves-reservadas';
import type { SalvarPreferenciaInput } from '@/lib/server/validation/preferencias.schema';

/**
 * Porte de PreferenciasService.salvar (Antares-backend/src/preferencias/preferencias.service.ts).
 *
 * Correção em relação ao original: o service do backend não impedia o usuário
 * de escrever na chave interna `auth.grupo_ativo_id` por esta rota genérica,
 * ignorando a validação de vínculo real com o grupo que `PATCH /grupo-ativo`
 * (definirGrupoAtivo) faz. Na prática isso não permitia escalar privilégio —
 * todo consumidor dessa preferência revalida o vínculo do usuário com o grupo
 * antes de confiar nela — mas era uma porta de escrita direta a uma chave
 * reservada, sem passar pela validação própria. Bloqueado aqui.
 */
export async function salvar(usuario_id: string, dto: SalvarPreferenciaInput) {
  if (CHAVES_PREFERENCIA_RESERVADAS.includes(dto.chave)) {
    throw new HttpError(403, `A chave "${dto.chave}" é reservada e não pode ser definida diretamente.`);
  }

  return prisma.preferenciasUsuario.upsert({
    where: { usuario_id_chave: { usuario_id, chave: dto.chave } },
    create: { usuario_id, chave: dto.chave, valor: dto.valor, ativo: true },
    update: { valor: dto.valor, ativo: true, atualizadoEm: new Date() },
  });
}
