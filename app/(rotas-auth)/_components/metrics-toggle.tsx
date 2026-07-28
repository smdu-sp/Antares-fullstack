/** @format */

"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProcessosMetrics from "@/components/processos-metrics";
import AndamentosMetrics from "@/components/andamentos-metrics";
import {
  buscarMetricasDashboard,
  MetricasDashboard,
} from "../_actions/buscar-metricas-dashboard";

export default function MetricsToggle() {
  const [showMetrics, setShowMetrics] = useState(false);
  const [metricas, setMetricas] = useState<MetricasDashboard | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregado, setCarregado] = useState(false);

  const toggleMetrics = useCallback(() => {
    setShowMetrics((prev) => !prev);
  }, []);

  // Carrega as métricas somente quando o painel é aberto pela primeira vez,
  // evitando pesar toda navegação/busca da página com esse cálculo.
  useEffect(() => {
    if (!showMetrics || carregado || carregando) return;

    setCarregando(true);
    buscarMetricasDashboard()
      .then((resultado) => {
        if (resultado) setMetricas(resultado);
      })
      .finally(() => {
        setCarregando(false);
        setCarregado(true);
      });
  }, [showMetrics, carregado, carregando]);

  return (
    <div className="w-full space-y-2 sm:space-y-4 overflow-hidden">
      {/* Toggle Button - Positioned Right */}
      <div className="flex justify-end w-full overflow-hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMetrics}
          className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0 h-8 sm:h-10"
        >
          {showMetrics ? (
            <>
              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Ocultar Resumo</span>
              <span className="sm:hidden">Ocultar</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mostrar Resumo</span>
              <span className="sm:hidden">Mostrar</span>
            </>
          )}
        </Button>
      </div>

      {/* Métricas - Condicionalmente renderizadas */}
      {showMetrics && (
        <div className="space-y-3 sm:space-y-6">
          {carregando && !metricas ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando métricas...
            </div>
          ) : (
            <>
              {/* Header com Título */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                <h2 className="text-base sm:text-1xl md:text-2xl font-bold">
                  Processos
                </h2>
              </div>

              {/* Métricas de Processos */}
              <ProcessosMetrics
                total={metricas?.processos.total ?? 0}
                vencendoHoje={metricas?.processos.vencendoHoje ?? 0}
                atrasados={metricas?.processos.atrasados ?? 0}
                emAndamento={metricas?.processos.emAndamento ?? 0}
              />

              {/* Header com Título */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mt-4 sm:mt-6">
                <h2 className="text-base sm:text-1xl md:text-2xl font-bold">
                  Andamentos
                </h2>
              </div>

              {/* Métricas de Andamentos */}
              <AndamentosMetrics
                emAndamento={metricas?.andamentos.emAndamento ?? 0}
                vencidos={metricas?.andamentos.vencidos ?? 0}
                vencendoHoje={metricas?.andamentos.vencendoHoje ?? 0}
                concluidos={metricas?.andamentos.concluidos ?? 0}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
