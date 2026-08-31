import { z } from 'zod';
import { GrupoCodigo, GrupoTipo, PermissaoGrupo } from '@prisma/client';

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

/** Lista completa de códigos de Permissoes desejados para um (usuário, grupo|global). */
export const atualizarPermissoesUsuarioSchema = z.object({
  codigos: z.array(z.string().min(1)),
});

/** Lista completa de códigos de Permissoes desejados para um (grupo, papel). */
export const atualizarPermissoesGrupoSchema = z.object({
  papel: z.nativeEnum(PermissaoGrupo),
  codigos: z.array(z.string().min(1)),
});

export type CreateGrupoInput = z.infer<typeof createGrupoSchema>;
export type UpdateGrupoInput = z.infer<typeof updateGrupoSchema>;
export type VincularUsuarioGrupoInput = z.infer<typeof vincularUsuarioGrupoSchema>;
export type AtualizarPermissoesUsuarioInput = z.infer<typeof atualizarPermissoesUsuarioSchema>;
export type AtualizarPermissoesGrupoInput = z.infer<typeof atualizarPermissoesGrupoSchema>;
