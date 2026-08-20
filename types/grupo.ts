/** @format */

export type GrupoCodigo = "EXPEDIENTE" | "SERVIN" | "GABINETE" | "GLOBAL" | "OUTORGA";
export type GrupoTipoEnum = "COORDENADORIA" | "DIVISAO";
export type PermissaoGrupoEnum = "ADM" | "TEC" | "USR";
export type NivelVisaoGrupoProcesso = "TOTAL" | "PARCIAL";

export interface IGrupo {
  id: string;
  codigo: GrupoCodigo;
  tipo: GrupoTipoEnum;
  nome: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ICreateGrupo {
  codigo: GrupoCodigo;
  tipo: GrupoTipoEnum;
  nome: string;
}

export interface IUpdateGrupo {
  codigo?: GrupoCodigo;
  tipo?: GrupoTipoEnum;
  nome?: string;
}

export interface IProcessoGrupo {
  id: string;
  processo_id: string;
  grupo_id: string;
  nivelVisao: NivelVisaoGrupoProcesso;
  ativo: boolean;
  grupo?: IGrupo;
}

export interface IMatrizPermissaoLinha {
  usuario: {
    id: string;
    nome: string;
    login: string;
    permissao: string;
    status: boolean;
  };
  grupo: {
    id: string;
    codigo: GrupoCodigo;
    tipo: GrupoTipoEnum;
    nome: string;
    ativo: boolean;
  };
  permissao: {
    visualizar_proprios: boolean;
    visualizar_grupo: boolean;
    modificar_proprios: boolean;
    modificar_grupo: boolean;
    excluir: boolean;
    ativo: boolean;
  } | null;
  efetivo: {
    processo_visualizar: boolean;
    processo_modificar: boolean;
    processo_excluir: boolean;
    andamento_visualizar: boolean;
    andamento_modificar: boolean;
    andamento_excluir: boolean;
    visualizacao_global_gabinete: boolean;
  };
}

export interface IRespostaAcessosAdmin<T> {
  ok: boolean;
  error: string | null;
  data: T | null;
  status: number;
}
