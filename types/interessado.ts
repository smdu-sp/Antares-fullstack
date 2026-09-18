/** @format */

export interface IInteressado {
  id: string;
  valor: string;
  criadoEm: string;
  atualizadoEm: string;
  ativo?: boolean;
  grupo_id?: string; // Grupo dono deste cadastro — cada grupo tem sua própria lista de interessados
}

export interface IPaginadoInteressado {
  data: IInteressado[];
  total: number;
  pagina: number;
  limite: number;
}
