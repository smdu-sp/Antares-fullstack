/** @format */

export interface IInteressado {
  id: string;
  valor: string;
  criadoEm: string;
  atualizadoEm: string;
  ativo?: boolean;
}

export interface IPaginadoInteressado {
  data: IInteressado[];
  total: number;
  pagina: number;
  limite: number;
}
