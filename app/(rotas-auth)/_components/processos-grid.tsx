/** @format */

"use client";

import { IProcesso } from "@/types/processo";
import { IUnidade } from "@/types/unidade";
import ProcessosSpreadsheet from "@/components/processos-spreadsheet";

interface ProcessosGridProps {
  processos: IProcesso[];
  unidades: IUnidade[];
  colunasProcessos?: string[];
  chavePreferenciaOrdem?: string;
  exibirAtribuicaoUsuario?: boolean;
  busca?: string;
  interessado?: string;
  unidade?: string;
  vencendoHoje?: boolean;
  atrasados?: boolean;
  concluidos?: boolean;
}

export function ProcessosGrid({
  processos,
  unidades,
  colunasProcessos = [],
  chavePreferenciaOrdem,
  exibirAtribuicaoUsuario = false,
  busca = "",
  interessado = "",
  unidade = "",
  vencendoHoje = false,
  atrasados = false,
  concluidos = false,
}: ProcessosGridProps) {
  return (
    <>
      <ProcessosSpreadsheet
        processos={processos}
        unidades={unidades}
        colunasProcessos={colunasProcessos}
        chavePreferenciaOrdem={chavePreferenciaOrdem}
        exibirAtribuicaoUsuario={exibirAtribuicaoUsuario}
        busca={busca}
        interessado={interessado}
        unidade={unidade}
        vencendoHoje={vencendoHoje}
        atrasados={atrasados}
        concluidos={concluidos}
      />
    </>
  );
}
