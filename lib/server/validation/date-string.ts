import { z } from 'zod';

/**
 * Porte do comportamento de @IsDateString() do class-validator: aceita qualquer
 * string parseável como data (incluindo datas sem horário, ex.: "2026-01-08"),
 * não só datetime ISO 8601 completo — `z.string().datetime()` é mais estrito
 * que o original e rejeitaria datas assim, então não usar `.datetime()` aqui.
 */
export function isoDateString(message: string) {
  return z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message });
}
