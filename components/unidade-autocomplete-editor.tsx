/** @format */

"use client";

import { IUnidade } from "@/types/unidade";
import { ICellEditorComp } from "ag-grid-community";
import { criar as criarUnidade } from "@/services/unidades/server-functions/criar";
import {
  listarTodas as listarTodasUnidades,
  reativarUnidade,
} from "@/services/unidades/server-functions/listar-todas";
import { toast } from "sonner";

// Cores da lista de sugestões (fixed, anexada ao body — escapa do tema/CSS
// vars do AG-Grid, então não segue o modo escuro sozinha; sem isso a lista
// ficava sempre branca com texto claro por cima, ilegível no modo escuro).
// Checado uma vez na criação: a classe "dark" é aplicada no <html> pelo
// next-themes (attribute="class"), inclusive quando o tema é "system".
const CORES_LISTA = {
  light: {
    bg: "#ffffff",
    border: "1px solid #ccc",
    borderItem: "1px solid #eee",
    texto: "#111827",
    textoMuted: "#666",
    textoPlaceholder: "#999",
    hover: "#f0f9ff",
    criarBg: "#f9fafb",
  },
  dark: {
    bg: "#262626",
    border: "1px solid #404040",
    borderItem: "1px solid #3f3f46",
    texto: "#e5e7eb",
    textoMuted: "#a3a3a3",
    textoPlaceholder: "#71717a",
    hover: "#374151",
    criarBg: "#1f2937",
  },
};

function corAtual() {
  return document.documentElement.classList.contains("dark")
    ? CORES_LISTA.dark
    : CORES_LISTA.light;
}

class UnidadeAutocompleteEditor implements ICellEditorComp {
  private eGui!: HTMLDivElement;
  private input!: HTMLInputElement;
  private listContainer!: HTMLDivElement;
  private unidades: IUnidade[] = [];
  private params: any;
  private cores = corAtual();

  init(params: any) {
    this.params = params;
    // Buscar dados do context do AG-Grid em vez de params diretos
    this.unidades = params.context?.unidades || params.unidades || [];
    this.cores = corAtual();

    this.eGui = document.createElement("div");
    this.eGui.style.position = "relative";
    this.eGui.style.width = "100%";
    this.eGui.style.height = "100%";

    // Input
    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.value = params.value || "";
    this.input.style.width = "100%";
    this.input.style.height = "100%";
    this.input.style.padding = "8px";
    this.input.style.boxSizing = "border-box";
    this.input.style.border = "none";
    this.input.style.outline = "2px solid #2563eb";
    this.input.style.fontSize = "14px";

    // Lista de sugestões - adicionar ao body para escapar do overflow da célula
    this.listContainer = document.createElement("div");
    this.listContainer.style.position = "fixed";
    this.listContainer.style.border = this.cores.border;
    this.listContainer.style.maxHeight = "250px";
    this.listContainer.style.overflowY = "auto";
    this.listContainer.style.zIndex = "10000";
    this.listContainer.style.display = "none";
    this.listContainer.style.boxShadow = "0 4px 6px rgba(0,0,0,0.25)";
    this.listContainer.style.minWidth = "200px";
    this.listContainer.style.backgroundColor = this.cores.bg;
    this.listContainer.style.color = this.cores.texto;
    this.listContainer.style.borderRadius = "4px";
    // Adicionar um data attribute para identificar e limpar depois
    this.listContainer.setAttribute("data-unidade-list", "true");
    document.body.appendChild(this.listContainer);

    this.eGui.appendChild(this.input);

    // Event listeners
    this.input.addEventListener("input", () => this.onInputChange());
    this.input.addEventListener("focus", () => this.onFocus());
    this.input.addEventListener("blur", () => this.onBlur());
    this.input.addEventListener("keydown", (e) => this.onKeyDown(e));

    // Mostrar sugestões iniciais
    setTimeout(() => {
      this.input.focus();
      this.input.select();
      this.updateSuggestions();
    }, 0);
  }

  private onInputChange() {
    this.updateSuggestions();
  }

  private onFocus() {
    this.updateSuggestions();
  }

  private onBlur() {
    // Fechar lista após um pequeno delay para permitir clique
    setTimeout(() => {
      this.listContainer.style.display = "none";
    }, 200);
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      this.listContainer.style.display = "none";
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedItem = this.listContainer.querySelector(
        "[data-selected='true']",
      ) as HTMLDivElement;
      if (selectedItem) {
        selectedItem.click();
      }
    }
  }

  private updateSuggestions() {
    const value = this.input.value.toLowerCase().trim();
    this.listContainer.innerHTML = "";

    // Calcular posição do input para posicionar fixed
    const rect = this.input.getBoundingClientRect();
    this.listContainer.style.top = `${rect.bottom}px`;
    this.listContainer.style.left = `${rect.left}px`;
    this.listContainer.style.width = `${rect.width}px`;

    // Filtrar unidades
    const filtered = this.unidades.filter((u) =>
      `${u.sigla} ${u.nome}`.toLowerCase().includes(value),
    );

    // Verificar se o input atual corresponde a uma unidade existente
    const inputMatchesExisting = this.unidades.some((u) => {
      const formatted = `${u.sigla} - ${u.nome}`;
      return formatted.toLowerCase() === value.toLowerCase();
    });

    if (filtered.length > 0) {
      filtered.forEach((unidade, index) => {
        const item = document.createElement("div");
        item.textContent = `${unidade.sigla} - ${unidade.nome}`;
        item.style.padding = "10px";
        item.style.cursor = "pointer";
        item.style.borderBottom = this.cores.borderItem;
        item.style.transition = "background-color 0.2s";
        item.style.fontSize = "14px";

        if (index === 0) {
          item.setAttribute("data-selected", "true");
          item.style.backgroundColor = this.cores.hover;
        }

        item.addEventListener("mouseover", () => {
          // Remove data-selected de todos
          this.listContainer
            .querySelectorAll("[data-selected='true']")
            .forEach((el) => {
              el.removeAttribute("data-selected");
              (el as HTMLDivElement).style.backgroundColor = "transparent";
            });
          // Add ao atual
          item.setAttribute("data-selected", "true");
          item.style.backgroundColor = this.cores.hover;
        });

        item.addEventListener("mousedown", (e) => {
          e.preventDefault(); // Previne que o input perca foco
          this.selectItem(unidade);
        });

        this.listContainer.appendChild(item);
      });

      this.listContainer.style.display = "block";
    } else if (value.trim().length > 0 && !inputMatchesExisting) {
      // Mostrar opção de criar novo - apenas se não houver match existente
      const item = document.createElement("div");
      item.textContent = `Criar: "${value}"`;
      item.style.padding = "10px";
      item.style.cursor = "pointer";
      item.style.color = this.cores.textoMuted;
      item.style.fontStyle = "italic";
      item.style.backgroundColor = this.cores.criarBg;
      item.setAttribute("data-selected", "true");

      item.addEventListener("mouseover", () => {
        item.style.backgroundColor = this.cores.hover;
      });

      item.addEventListener("mouseout", () => {
        item.style.backgroundColor = this.cores.criarBg;
      });

      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        // Criar nova unidade
        this.criarNovaUnidade(value);
      });

      this.listContainer.appendChild(item);
      this.listContainer.style.display = "block";
    } else {
      // Mostrar placeholder
      const item = document.createElement("div");
      item.textContent = "Selecione uma unidade";
      item.style.padding = "10px";
      item.style.color = this.cores.textoPlaceholder;
      item.style.fontStyle = "italic";

      this.listContainer.appendChild(item);
      this.listContainer.style.display = "block";
    }
  }

  private selectItem(unidade: IUnidade) {
    this.input.value = `${unidade.sigla} - ${unidade.nome}`;
    this.listContainer.style.display = "none";
    // Finalizar a edição no AG-Grid para disparar onCellValueChanged
    if (this.params.stopEditing) {
      this.params.stopEditing();
    }
  }

  private async criarNovaUnidade(valor: string) {
    // Mostrar loading
    this.input.disabled = true;
    this.input.style.opacity = "0.6";

    try {
      // Tentar extrair sigla e nome a partir do input
      // Se o input for "ABC - Nome Completo", usa ABC como sigla
      // Se for apenas "Nome", usa os primeiros 3 caracteres como sigla
      let sigla = "";
      let nome = valor.trim();

      const partes = valor.split("-");
      if (partes.length === 2) {
        sigla = partes[0].trim().toUpperCase();
        nome = partes[1].trim();
      } else {
        // Se não tem "-", usar os primeiros 3 caracteres como sigla
        sigla = valor.substring(0, 3).toUpperCase();
      }

      // Validar se tem sigla e nome
      if (!sigla || sigla.length === 0 || !nome || nome.length === 0) {
        toast.error("Erro ao criar unidade", {
          description:
            "Preencha corretamente: [SIGLA] - [NOME] ou apenas o nome",
        });
        this.input.disabled = false;
        this.input.style.opacity = "1";
        return;
      }

      // Chamar server function para criar
      let resposta = await criarUnidade({
        sigla: sigla,
        nome: nome,
      });

      // Se erro de duplicata (409 Conflict ou mensagem de duplicata), tentar reativar
      const isDuplicata =
        resposta.status === 409 ||
        (resposta.error &&
          resposta.error.toLowerCase().includes("já existe")) ||
        (resposta.error && resposta.error.toLowerCase().includes("duplicat"));

      if (!resposta.ok && isDuplicata) {
        try {
          // Tentar reativar uma unidade inativa com mesmo nome/sigla
          resposta = await this.reativarUnidadeInativa(sigla, nome);
        } catch (error) {
          console.error("Erro ao reativar unidade:", error);
        }
      }

      if (resposta.ok && resposta.data) {
        // Unidade criada ou reativada com sucesso
        const novaUnidade = resposta.data as IUnidade;

        // Adicionar à lista local
        this.unidades.push(novaUnidade);

        // Usar o valor criado
        this.input.value = `${novaUnidade.sigla} - ${novaUnidade.nome}`;
        this.listContainer.style.display = "none";

        // Finalizar edição
        if (this.params.stopEditing) {
          this.params.stopEditing();
        }
      } else {
        toast.error("Erro ao criar unidade", {
          description: resposta.error || "Erro desconhecido",
        });
      }
    } catch (error) {
      console.error("Erro ao criar unidade:", error);
      toast.error("Erro ao criar unidade", {
        description: "Tente novamente mais tarde",
      });
    } finally {
      this.input.disabled = false;
      this.input.style.opacity = "1";
    }
  }

  private async reativarUnidadeInativa(sigla: string, nome: string) {
    try {
      // Buscar todas as unidades (incluindo inativas) via server action
      const todasUnidades = await listarTodasUnidades();

      // Procurar unidade inativa com mesma sigla ou nome
      const unidadeInativa = todasUnidades.find(
        (u: IUnidade) =>
          u.ativo === false &&
          (u.sigla.toUpperCase() === sigla.toUpperCase() ||
            u.nome.toUpperCase() === nome.toUpperCase()),
      );

      if (unidadeInativa) {
        // Reativar a unidade
        const respostaAtualizar = await reativarUnidade(unidadeInativa.id, {
          nome: nome,
          sigla: sigla,
        });

        return respostaAtualizar;
      }

      // Se não encontrou inativa, retornar erro
      return {
        ok: false,
        error: "Unidade não encontrada",
        data: null,
        status: 404,
      };
    } catch (error) {
      console.error("Erro ao reativar unidade:", error);
      return {
        ok: false,
        error: "Erro ao reativar unidade",
        data: null,
        status: 500,
      };
    }
  }

  getGui() {
    return this.eGui;
  }

  getValue() {
    return this.input.value;
  }

  isPopup() {
    return false;
  }

  focusIn() {
    this.input.focus();
  }

  focusOut() {
    this.listContainer.style.display = "none";
  }

  destroy() {
    // Remover o listContainer do DOM quando o editor fechar
    if (this.listContainer && this.listContainer.parentNode) {
      this.listContainer.parentNode.removeChild(this.listContainer);
    }
  }

  isCancelAfterEnd?(): boolean {
    return false;
  }

  isCancelBeforeStart?(): boolean {
    return false;
  }
}

export default UnidadeAutocompleteEditor;
