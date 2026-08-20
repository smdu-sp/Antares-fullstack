import { z } from 'zod';
import { GrupoCodigo, GrupoTipo, NivelVisaoGrupoProcesso, PermissaoGrupo } from '@prisma/client';

/** Porte de CreateGrupoDto (Antares-backend/src/acessos-admin/dto/create-grupo.dto.ts). */
export const createGrupoSchema = z.object({
  codigo: z.nativeEnum(GrupoCodigo),
  tipo: z.nativeEnum(GrupoTipo),
  nome: z.string().min(1).max(120),
});

/** Porte de UpdateGrupoDto (PartialType de CreateGrupoDto). */
export const updateGrupoSchema = createGrupoSchema.partial();

/** Porte de VincularUsuarioGrupoDto (Antares-backend/src/acessos-admin/dto/vincular-usuario-grupo.dto.ts). */
export const vincularUsuarioGrupoSchema = z.object({
  ativo: z.boolean().optional(),
  permissao_grupo: z.nativeEnum(PermissaoGrupo).optional(),
});

/** Porte de AtualizarPermissoesUsuarioGrupoDto. */
export const atualizarPermissoesUsuarioGrupoSchema = z.object({
  visualizar_proprios: z.boolean().optional(),
  visualizar_grupo: z.boolean().optional(),
  modificar_proprios: z.boolean().optional(),
  modificar_grupo: z.boolean().optional(),
  excluir: z.boolean().optional(),
  ativo: z.boolean().optional(),
});

/** Porte de VincularProcessoGrupoDto (Antares-backend/src/acessos-admin/dto/vincular-processo-grupo.dto.ts). */
export const vincularProcessoGrupoSchema = z.object({
  nivelVisao: z.nativeEnum(NivelVisaoGrupoProcesso).optional(),
  ativo: z.boolean().optional(),
});

export type CreateGrupoInput = z.infer<typeof createGrupoSchema>;
export type UpdateGrupoInput = z.infer<typeof updateGrupoSchema>;
export type VincularUsuarioGrupoInput = z.infer<typeof vincularUsuarioGrupoSchema>;
export type AtualizarPermissoesUsuarioGrupoInput = z.infer<typeof atualizarPermissoesUsuarioGrupoSchema>;
export type VincularProcessoGrupoInput = z.infer<typeof vincularProcessoGrupoSchema>;
