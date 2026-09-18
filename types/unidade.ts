/** @format */

export interface IUnidade {
  ativo: boolean;
  id: string;
  nome: string;
  sigla: string;
  criadoEm: Date;
  atualizadoEm: Date;
  // Presente só nas unidades de processo (UnidadeGrupo) — undefined nas do
  // catálogo global (Unidade, usado no cadastro de usuário).
  grupo_id?: string;
}

export interface ICreateUnidade {
  nome: string;
  sigla: string;
}

export interface IUpdateUnidade {
  nome?: string;
  sigla?: string;
}

export interface IPaginadoUnidade {
  data: IUnidade[];
  total: number;
  pagina: number;
  limite: number;
}

export interface IRespostaUnidade {
  ok: boolean;
  error: string | null;
  data: IUnidade | IUnidade[] | IPaginadoUnidade | { removido: boolean } | null;
  status: number;
}
