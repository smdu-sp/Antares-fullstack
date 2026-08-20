import { Permissao } from '@prisma/client';

/** Porte de UsuariosService.validaPermissaoCriador (Antares-backend/src/usuarios/usuarios.service.ts). */
export function validaPermissaoCriador(permissao: Permissao, permissaoCriador: Permissao): Permissao {
  if (permissao === Permissao.DEV && permissaoCriador === Permissao.ADM) {
    return Permissao.ADM;
  }
  return permissao;
}
