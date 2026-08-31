/** @format */

import type { IUsuario, IUsuarioSession } from "@/types/usuario";
import type { IGrupoAtivo } from "@/types/grupo-ativo";

type SessionLike = {
  usuario?: {
    dev?: boolean;
  };
  grupoAtivo?: IGrupoAtivo;
};

type UsuarioLike =
  | IUsuario
  | IUsuarioSession
  | SessionLike
  | {
      dev?: boolean;
    }
  | null
  | undefined;

// Mapeia o papel real dentro do grupo (`usuario_grupo.permissao_grupo`: ADM/TEC/USR)
// para o mesmo vocabulário de bucket usado pelas checagens de UI (ADMINISTRADOR/
// EDITOR/LEITOR). É o papel de grupo — não a permissão de sistema — que decide isso.
function mapearPapelGrupo(papel: string): string | null {
  if (papel === "ADM") return "ADMINISTRADOR";
  if (papel === "TEC") return "EDITOR";
  if (papel === "USR") return "LEITOR";
  return null;
}

function getPermissaoCoordenadoriaDoGrupo(
  grupoAtivo?: IGrupoAtivo,
): string | null {
  const papel = grupoAtivo?.membroAtivo?.permissao;
  if (!papel) return null;
  return mapearPapelGrupo(papel);
}

export function getPermissaoCoordenadoria(usuario: UsuarioLike): string {
  const sessao = usuario as SessionLike;

  const permissaoDoGrupo = getPermissaoCoordenadoriaDoGrupo(sessao?.grupoAtivo);
  if (permissaoDoGrupo) {
    return permissaoDoGrupo;
  }

  const usuarioDireto = usuario as {
    dev?: boolean;
  };

  const ehDev = sessao?.usuario?.dev ?? usuarioDireto?.dev;
  // Só DEV tem bypass de sistema — qualquer outro papel precisa vir de um vínculo
  // de grupo real, resolvido acima via getPermissaoCoordenadoriaDoGrupo().
  if (ehDev) return "ADMINISTRADOR";
  return "LEITOR";
}

export function hasGrupoAtivo(usuario: UsuarioLike): boolean {
  const sessao = usuario as SessionLike;
  return !!sessao?.grupoAtivo?.id;
}

export function canRead(usuario: UsuarioLike): boolean {
  return ["LEITOR", "EDITOR", "ADMINISTRADOR"].includes(
    getPermissaoCoordenadoria(usuario),
  );
}

export function canEdit(usuario: UsuarioLike): boolean {
  return ["EDITOR", "ADMINISTRADOR"].includes(
    getPermissaoCoordenadoria(usuario),
  );
}

export function canAdmin(usuario: UsuarioLike): boolean {
  return getPermissaoCoordenadoria(usuario) === "ADMINISTRADOR";
}
