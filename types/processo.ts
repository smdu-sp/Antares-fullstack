/** @format */

export enum StatusAndamento {
  EM_ANDAMENTO = "EM_ANDAMENTO",
  CONCLUIDO = "CONCLUIDO",
  PRORROGADO = "PRORROGADO",
}

export interface IUsuario {
  id: string;
  nome: string;
  nomeSocial?: string | null;
  login: string;
  email: string;
  permissao: string;
  status: boolean;
  avatar?: string | null;
  ultimoLogin: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface IAndamento {
  id: string;
  origem: string;
  destino: string;
  data_envio?: Date | null;
  prazo: Date;
  prorrogacao?: Date | null;
  conclusao?: Date | null;
  status: StatusAndamento;
  data_resposta?: Date | null;
  assunto?: string | null;
  observacao?: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  processo_id: string;
  usuario_id: string;
  usuario_prorrogacao_id?: string | null;
  processo?: IProcesso;
  usuario?: IUsuario;
  usuarioProrrogacao?: IUsuario | null;
}

export interface IProcesso {
  id: string;
  numero_sei: string;
  assunto: string;
  interessado?: string;
  interessado_id?: string;
  unidadeInteressada?: { id: string; nome: string; sigla: string };
  unidade_remetente?: string;
  unidade_remetente_id?: string;
  unidadeRemetente?: { id: string; nome: string; sigla: string };
  unidade_destino?: string;
  unidade_destino_id?: string;
  unidadeDestino?: { id: string; nome: string; sigla: string };
  origem?: string;
  data_recebimento?: Date;
  prazo?: Date;
  data_prorrogacao?: Date | null;
  data_resposta_final?: Date | null;
  resposta_final?: string | null;
  data_envio_unidade?: Date | null;
  usuario_atribuido_id?: string | null;
  usuarioAtribuido?: { id: string; nome: string } | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  andamentos?: IAndamento[];
}

export interface ICreateProcesso {
  numero_sei: string;
  assunto: string;
  unidade_interessada_id?: string;
  unidade_remetente_id?: string;
  unidade_destino_id?: string;
  origem: string;
  data_recebimento: string;
  data_envio_unidade?: string;
  usuario_atribuido_id?: string;
}

export interface IUpdateProcesso {
  numero_sei?: string;
  assunto?: string;
  interessado_id?: string | null;
  unidade_interessada_id?: string;
  unidade_remetente_id?: string;
  unidade_destino_id?: string;
  origem?: string;
  data_recebimento?: string;
  prazo?: string;
  data_prorrogacao?: string;
  data_envio_unidade?: string;
  data_resposta_final?: string;
  resposta_final?: string;
  usuario_atribuido_id?: string | null;
}

export interface ICreateAndamento {
  processo_id: string;
  origem: string;
  destino: string;
  data_envio?: string;
  prazo: string;
  status?: StatusAndamento;
  assunto?: string;
  resposta?: string;
  observacao?: string;
}

export interface IUpdateAndamento {
  origem?: string;
  destino?: string;
  data_envio?: string;
  prazo?: string;
  prorrogacao?: string;
  conclusao?: string;
  status?: StatusAndamento;
  assunto?: string;
  resposta?: string;
  observacao?: string;
}

export interface IPaginadoProcesso {
  data: IProcesso[];
  total: number;
  pagina: number;
  limite: number;
}

export interface IRespostaProcesso {
  ok: boolean;
  error: string | null;
  data:
    | IProcesso
    | IProcesso[]
    | IPaginadoProcesso
    | { removido: boolean }
    | null;
  status: number;
}

export interface IPoliticaColunasProcesso {
  colunasFixas?: string[];
  colunasDisponiveis?: string[];
  ordemPadrao?: string[];
  ordemUsuario?: string[];
  ordemEfetiva?: string[];
  chavePreferenciaOrdem?: string;
}

export interface IRespostaPoliticaColunasProcesso {
  ok: boolean;
  error: string | null;
  data: IPoliticaColunasProcesso | null;
  status: number;
}

export interface IRespostaAndamento {
  ok: boolean;
  error: string | null;
  data:
    | IAndamento
    | IAndamento[]
    | { total: number; pagina: number; limite: number; data: IAndamento[] }
    | { removido: boolean }
    | null;
  status: number;
}
