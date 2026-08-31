/**
 * Porte de UsuariosService.validaPermissaoCriador (Antares-backend/src/usuarios/usuarios.service.ts),
 * adaptado ao modelo boolean: só um criador que já é `dev` pode conceder `dev` a outra
 * pessoa. Qualquer outro criador nunca concede `dev`, independente do que pediu.
 */
export function validaDevCriador(devSolicitado: boolean, criadorEhDev: boolean): boolean {
  return devSolicitado && criadorEhDev;
}
