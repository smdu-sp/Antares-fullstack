/** @format */

export interface IUnidadeUsuario {
  id: string;
  nome: string;
  sigla: string;
}

export interface IGrupoUsuarioResumo {
  grupo: {
    id: string;
    nome: string;
    codigo: string;
  };
}

export interface IUsuario {
  id: string;
  nome: string;
  login: string;
  email: string;
  dev: boolean;
  avatar?: string;
  status: boolean;
  ultimoLogin: Date;
  criadoEm: Date;
  atualizadoEm: Date;
  nomeSocial?: string;
  unidade_id: string;
  unidade?: IUnidadeUsuario;
  grupos?: IGrupoUsuarioResumo[];
}

export interface ICreateUsuario {
  nome: string;
  email: string;
  login: string;
  avatar?: string;
  dev?: boolean;
  status?: boolean;
  nomeSocial?: string;
  unidade_id: string;
}

export interface IUpdateUsuario {
  id?: string;
  status?: boolean;
  nomeSocial?: string;
  avatar?: string;
  dev?: boolean;
  unidade_id?: string;
}

export interface IPaginadoUsuario {
  data: IUsuario[];
  total: number;
  pagina: number;
  limite: number;
}

export interface INovoUsuario {
  login: string;
  nome: string;
  email: string;
}

export interface IUsuarioTecnico {
  id: string;
  nome: string;
}

export interface IRespostaUsuario {
  ok: boolean;
  error: string | null;
  data:
    | INovoUsuario
    | IUsuario
    | IUsuario[]
    | IUsuarioTecnico[]
    | IPaginadoUsuario
    | { autorizado: boolean }
    | { desativado: boolean }
    | null;
  status: number;
}

export interface IUsuarioSession {
  sub: string;
  nome: string;
  login: string;
  email: string;
  nomeSocial?: string;
  dev: boolean;
  status: number;
  avatar?: string;
  iat: number;
  exp: number;
}
