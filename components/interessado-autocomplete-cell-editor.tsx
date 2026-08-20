/** @format */

"use client";

import { IInteressado } from "@/types/interessado";
import { ICellEditorComp } from "ag-grid-community";
import { criar as criarInteressado } from "@/services/interessados/server-functions/criar";
import { toast } from "sonner";
class InteressadoAutocompleteCellEditor implements ICellEditorComp {
  private eGui!: HTMLDivElement;
  private input!: HTMLInputElement;
  private listContainer!: HTMLDivElement;
  private interessados: IInteressado[] = [];
  private params: any;

  init(params: any) {
    this.params = params;
    // Buscar dados do context do AG-Grid em vez de params diretos
    this.interessados =
      params.context?.interessados || params.interessados || [];

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
    this.listContainer.style.backgroundColor = "white";
    this.listContainer.style.border = "1px solid #ccc";
    this.listContainer.style.maxHeight = "250px";
    this.listContainer.style.overflowY = "auto";
    this.listContainer.style.zIndex = "10000";
    this.listContainer.style.display = "none";
    this.listContainer.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
    this.listContainer.style.minWidth = "200px";
    this.listContainer.style.backgroundColor = "#ffffff";
    this.listContainer.style.borderRadius = "4px";
    // Adicionar um data attribute para identificar e limpar depois
    this.listContainer.setAttribute("data-interessado-list", "true");
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

    // Verificar se o input corresponde a um interessado existente
    const inputMatchesExisting = this.interessados.some((i) => {
      return i.valor.toLowerCase() === value;
    });

    // Filtrar interessados
    const filtered = this.interessados.filter((i) =>
      i.valor.toLowerCase().includes(value),
    );

    if (filtered.length > 0) {
      filtered.forEach((interessado, index) => {
        const item = document.createElement("div");
        item.textContent = interessado.valor.toUpperCase();
        item.style.padding = "10px";
        item.style.cursor = "pointer";
        item.style.borderBottom = "1px solid #eee";
        item.style.transition = "background-color 0.2s";
        item.style.fontSize = "14px";

        if (index === 0) {
          item.setAttribute("data-selected", "true");
          item.style.backgroundColor = "#f0f9ff";
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
          item.style.backgroundColor = "#f0f9ff";
        });

        item.addEventListener("mousedown", (e) => {
          e.preventDefault(); // Previne que o input perca foco
          this.selectItem(interessado);
        });

        this.listContainer.appendChild(item);
      });

      this.listContainer.style.display = "block";
    } else if (value.trim().length > 0 && !inputMatchesExisting) {
      // Mostrar opção de criar novo
      const item = document.createElement("div");
      item.textContent = `Criar: "${value}"`;
      item.style.padding = "10px";
      item.style.cursor = "pointer";
      item.style.color = "#666";
      item.style.fontStyle = "italic";
      item.style.backgroundColor = "#f9fafb";
      item.setAttribute("data-selected", "true");

      item.addEventListener("mouseover", () => {
        item.style.backgroundColor = "#f0f9ff";
      });

      item.addEventListener("mouseout", () => {
        item.style.backgroundColor = "#f9fafb";
      });

      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        // Criar novo interessado
        this.criarNovoInteressado(value);
      });

      this.listContainer.appendChild(item);
      this.listContainer.style.display = "block";
    } else {
      // Mostrar placeholder
      const item = document.createElement("div");
      item.textContent = "Selecione um interessado";
      item.style.padding = "10px";
      item.style.color = "#999";
      item.style.fontStyle = "italic";

      this.listContainer.appendChild(item);
      this.listContainer.style.display = "block";
    }
  }

  private selectItem(interessado: IInteressado) {
    this.input.value = interessado.valor;
    this.listContainer.style.display = "none";
    // Finalizar a edição no AG-Grid para disparar onCellValueChanged
    if (this.params.stopEditing) {
      this.params.stopEditing();
    }
  }

  private async criarNovoInteressado(valor: string) {
    // Mostrar loading
    this.input.disabled = true;
    this.input.style.opacity = "0.6";

    try {
      // Validar se tem conteúdo
      if (!valor || valor.trim().length === 0) {
        toast.error("Erro ao criar interessado", {
          description: "Preencha o nome do interessado",
        });
        this.input.disabled = false;
        this.input.style.opacity = "1";
        return;
      }

      // Chamar server function para criar (reativa automaticamente um interessado
      // inativo com o mesmo nome, se existir — ver lib/server/interessados/criar.ts)
      const resposta = await criarInteressado({
        valor: valor.trim(),
      });

      if (resposta.ok && resposta.data) {
        // Interessado criado ou reativado com sucesso
        const novoInteressado = resposta.data as IInteressado;

        // Adicionar à lista local
        this.interessados.push(novoInteressado);

        // Usar o valor criado
        this.input.value = novoInteressado.valor;
        this.listContainer.style.display = "none";

        // Finalizar edição
        if (this.params.stopEditing) {
          this.params.stopEditing();
        }
      } else {
        toast.error("Erro ao criar interessado", {
          description: resposta.error,
        });
      }
    } catch (error) {
      console.error("Erro ao criar interessado:", error);
      toast.error("Erro ao criar interessado", {
        description: "Tente novamente mais tarde",
      });
    } finally {
      this.input.disabled = false;
      this.input.style.opacity = "1";
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

export default InteressadoAutocompleteCellEditor;
