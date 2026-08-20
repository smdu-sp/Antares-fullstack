/** @format */

export interface IGrupoDisponivel {
  id: string;
  nome: string;
  sigla?: string;
}

export interface IGrupoAtivo {
  id: string;
  nome: string;
  sigla?: string;
  codigo?: string;
  // Papel real do usuário dentro deste grupo (`usuario_grupo.permissao_grupo`:
  // "ADM" | "TEC" | "USR") — usado por getPermissaoCoordenadoria() em access-control.ts.
  membroAtivo?: {
    permissao?: string;
  };
  gruposDisponiveis?: IGrupoDisponivel[];
}

export interface IRespostaGrupoAtivo<T> {
  ok: boolean;
  error: string | null;
  data: T | null;
  status: number;
}
