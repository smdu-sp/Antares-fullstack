/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  RefreshCw,
  X,
  Search,
  Loader2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
// Use simple { from?: Date | null; to?: Date | null } instead of react-day-picker types
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { DatePickerWithRange } from "./ui/date-range";
import { format } from "date-fns";
import { cn, verificaData } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

interface CampoFiltravel {
  nome: string;
  tag: string;
  tipo: TiposFiltros;
  default?: string;
  valores?: CampoSelect[] | CampoDataRange;
  placeholder?: string;
}

export enum TiposFiltros {
  TEXTO,
  DATA,
  SELECT,
  AUTOCOMPLETE,
}

interface CampoSelect {
  value: string | number;
  label: string;
}

interface CampoDataRange {
  modo: "unico" | "intervalo";
}

interface FiltrosProps {
  camposFiltraveis?: CampoFiltravel[];
  showSearchButton?: boolean;
  showClearButton?: boolean;
  autoSearch?: boolean; // Nova prop para busca automática
  debounceMs?: number; // Tempo de espera antes de buscar
  clearOtherFiltersOnSearch?: boolean; // Limpar outros filtros da URL ao fazer busca
}

export function Filtros({
  camposFiltraveis,
  showSearchButton = true,
  showClearButton = true,
  autoSearch = false,
  debounceMs = 500,
  clearOtherFiltersOnSearch = false,
}: FiltrosProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();
  const [filtros, setFiltros] = useState<{ [key: string]: string }>(
    camposFiltraveis
      ? camposFiltraveis.reduce(
          (acc, item) => ({ ...acc, [item.tag]: item.default || "" }),
          {},
        )
      : {},
  );

  // Timer para debounce — em ref, não state: o valor em si nunca precisa
  // disparar um re-render, só precisa sobreviver entre renders pra poder ser
  // limpo. Guardar em useState fazia o componente re-renderizar a cada
  // tecla digitada só pra armazenar o id do timer.
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicialização - sincroniza com URL apenas uma vez. Deliberadamente só no
  // mount: isso lê a URL pra montar o estado inicial; reagir a
  // camposFiltraveis/searchParams depois disso re-inicializaria os filtros a
  // cada navegação disparada pelo próprio atualizaFiltros(), quebrando o fluxo.
  useEffect(() => {
    const initialFiltros: { [key: string]: string } = {};

    if (camposFiltraveis) {
      for (const campo of camposFiltraveis) {
        const paramValue = searchParams.get(campo.tag);
        initialFiltros[campo.tag] = paramValue || campo.default || "";
      }
    }

    setFiltros(initialFiltros);
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atualizaFiltros = useCallback(() => {
    let urlParams = "pagina=1&"; // Sempre reseta para página 1 ao filtrar

    if (clearOtherFiltersOnSearch) {
      // Se clearOtherFiltersOnSearch estiver ativo, apenas adiciona os filtros gerenciados
      for (const [key, value] of Object.entries(filtros)) {
        if (value) {
          // Só adiciona se tiver valor
          urlParams += `${key}=${value}&`;
        }
      }
    } else {
      // Mantém comportamento original
      for (const [key, value] of Object.entries(filtros)) {
        urlParams += `${key}=${value}&`;
      }
    }

    router.push(`${pathname}?${urlParams}`);
  }, [filtros, clearOtherFiltersOnSearch, router, pathname]);

  // Auto-search com debounce quando autoSearch está ativo
  useEffect(() => {
    // Não executa antes da inicialização
    if (!isInitialized || !autoSearch) return;

    // Marca como pesquisando enquanto aguarda
    setIsSearching(true);

    // Limpa o timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cria novo timer
    const timer = setTimeout(() => {
      atualizaFiltros();
      setIsSearching(false);
    }, debounceMs);

    debounceTimerRef.current = timer;

    // Cleanup
    return () => {
      clearTimeout(timer);
    };
  }, [filtros, isInitialized, autoSearch, debounceMs, atualizaFiltros]);

  function limpaFiltros() {
    setFiltros(
      camposFiltraveis
        ? camposFiltraveis.reduce(
            (acc, item) => ({ ...acc, [item.tag]: "" }),
            {},
          )
        : {},
    );
    router.push(pathname);
  }

  function renderFiltros() {
    const filtrosArr: any[] = [];
    if (camposFiltraveis) {
      for (const campo of camposFiltraveis) {
        switch (campo.tipo) {
          case TiposFiltros.TEXTO:
            filtrosArr.push(RenderTexto(campo));
            break;
          case TiposFiltros.DATA:
            filtrosArr.push(RenderDataRange(campo));
            break;
          case TiposFiltros.SELECT:
            filtrosArr.push(RenderSelect(campo));
            break;
          case TiposFiltros.AUTOCOMPLETE:
            filtrosArr.push(RenderAutocomplete(campo));
            break;
        }
      }
    }
    return filtrosArr;
  }

  function RenderTexto(campo: CampoFiltravel) {
    return (
      <div className="flex flex-col w-full gap-2" key={campo.tag}>
        <label className="text-sm font-medium text-foreground">
          {campo.nome}
        </label>
        <div className="relative">
          <Input
            value={filtros[campo.tag]}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, [campo.tag]: e.target.value }))
            }
            className="bg-background h-10 sm:h-12 text-sm sm:text-base pr-10"
            placeholder={campo.placeholder}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {autoSearch && isSearching ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground animate-spin" />
            ) : (
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    );
  }

  function RenderSelect(campo: CampoFiltravel) {
    return (
      <div className="flex flex-col w-full md:w-60" key={campo.tag}>
        <p>{campo.nome}</p>
        <Select
          onValueChange={(value) =>
            setFiltros((prev) => ({ ...prev, [campo.tag]: value }))
          }
          value={filtros[campo.tag]}
        >
          <SelectTrigger className="w-full md:w-60 h-10 sm:h-12 text-nowrap bg-background">
            <SelectValue placeholder={campo.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-nowrap">
              Tudo
            </SelectItem>
            {campo.valores &&
              (campo.valores as CampoSelect[]).map((item) => {
                return (
                  <SelectItem key={item.value} value={item.value.toString()}>
                    {item.label}
                  </SelectItem>
                );
              })}
          </SelectContent>
        </Select>
      </div>
    );
  }

  function RenderAutocomplete(campo: CampoFiltravel) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(campo.default || "");
    const valores = (campo.valores as CampoSelect[]) || [];
    return (
      <div className="flex flex-col w-full md:w-60" key={campo.tag}>
        <p>{campo.nome}</p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full sm:w-[180px] md:w-[200px] justify-between"
            >
              {value
                ? valores.find((opcao) => opcao.label === value)?.label
                : campo.placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[150px] sm:w-[180px] md:w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Buscar opção" />
              <CommandList>
                <CommandEmpty>Opção não encontrada</CommandEmpty>
                <CommandGroup>
                  {valores.map((opcao) => (
                    <CommandItem
                      key={opcao.value}
                      value={opcao.value.toString()}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue);
                        setFiltros((prev) => ({ ...prev, [campo.tag]: value }));
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === opcao.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {opcao.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  function RenderDataRange(campo: CampoFiltravel) {
    const param = searchParams.get(campo.tag);
    const datas = param ? param.split(",") : ["", ""];

    const [from, to] = verificaData(datas[0], datas[1]);
    const [date, setDate] = useState<
      { from?: Date | null; to?: Date | null } | undefined
    >(datas[0] !== "" && datas[1] !== "" ? { from, to } : undefined);

    function handleSelecionaData(
      date: { from?: Date | null; to?: Date | null } | undefined,
    ) {
      setDate(date);
      const from = date?.from ? format(date.from, "dd-MM-yyyy") : "";
      const to = date?.to ? format(date.to, "dd-MM-yyyy") : "";
      const periodo = from !== "" && to !== "" ? `${from},${to}` : "";
      if (periodo === "")
        toast.error("Selecione um período para filtrar por data");
      setFiltros((prev) => ({ ...prev, [campo.tag]: periodo }));
    }

    useEffect(() => {
      const paramUpdate = searchParams.get(campo.tag);
      const datas =
        paramUpdate && paramUpdate !== "" ? paramUpdate.split(",") : ["", ""];
      const [from, to] = verificaData(datas[0], datas[1]);
      setDate(datas[0] !== "" && datas[1] !== "" ? { from, to } : undefined);
      // searchParams precisa continuar na lista mesmo o eslint achando que não
      // (RenderDataRange não é reconhecido como componente por não ser
      // renderizado via JSX) — é o valor que muda quando a URL muda, e é
      // literalmente lido no corpo do efeito acima.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, campo.tag]);

    return (
      <div className={"flex flex-col grid gap-2"} key={campo.tag}>
        <p>{campo.nome}</p>
        <DatePickerWithRange
          className="w-full sm:w-[150px] md:w-[300px]"
          value={date}
          onChange={handleSelecionaData}
          defaultMonth={date?.from ?? undefined}
          numberOfMonths={2}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full items-stretch sm:items-end">
      {renderFiltros()}
      {showSearchButton && (
        <Button
          className="w-full sm:w-auto h-10 sm:h-12"
          size="lg"
          disabled={isPending}
          onClick={() => startTransition(() => atualizaFiltros())}
          title="Aplicar filtros"
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-2", isPending && "animate-spin")}
          />
          Buscar
        </Button>
      )}
      {showClearButton && !showSearchButton && (
        <Button
          variant={"outline"}
          size="lg"
          disabled={isPending}
          className="w-full sm:w-auto h-10 sm:h-12"
          onClick={() => startTransition(() => limpaFiltros())}
          title="Limpar filtros"
        >
          <X className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}
