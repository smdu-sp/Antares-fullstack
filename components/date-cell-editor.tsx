/** @format */

import { ICellEditorComp, ICellEditorParams } from "ag-grid-community";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/pt-br";

dayjs.extend(customParseFormat);
dayjs.locale("pt-br");

// Marca o popup do calendário pra poder localizar (e limpar) instâncias órfãs
// deixadas no body por uma sessão de edição anterior que não chamou destroy()
// corretamente (ex.: linha reciclada/recarregada pelo AG-Grid enquanto o
// calendário estava aberto) — é isso que fazia o seletor ficar "travado" na
// tela, sem fechar no clique fora nem responder à seleção de data.
const CALENDAR_MARKER_ATTR = "data-date-cell-editor-calendar";

function removerCalendariosOrfaos() {
  document
    .querySelectorAll(`[${CALENDAR_MARKER_ATTR}]`)
    .forEach((el) => el.parentElement?.removeChild(el));
}

export default class DateCellEditor implements ICellEditorComp {
  value: Date | null = null;
  params!: ICellEditorParams;
  input!: HTMLInputElement;
  textValue: string = "";
  container!: HTMLElement;
  calendarOpen = false;
  calendarContainer!: HTMLElement;
  closeListener: ((event: MouseEvent) => void) | null = null;

  init(params: ICellEditorParams): void {
    // Uma sessão de edição nova começando é a melhor oportunidade de limpar
    // qualquer calendário órfão de uma sessão anterior mal encerrada.
    removerCalendariosOrfaos();
    this.params = params;
    this.value = params.value || null;
    // Converter data inicial para formato DD/MM/YYYY
    if (this.value instanceof Date) {
      const day = String(this.value.getDate()).padStart(2, "0");
      const month = String(this.value.getMonth() + 1).padStart(2, "0");
      const year = this.value.getFullYear();
      this.textValue = `${day}/${month}/${year}`;
    }
  }

  private renderCalendar(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Limpar calendário anterior
    this.calendarContainer.innerHTML = "";

    // Header com navegação
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "12px";
    header.style.padding = "0 4px";

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.textContent = "←";
    prevBtn.style.background = "none";
    prevBtn.style.border = "none";
    prevBtn.style.cursor = "pointer";
    prevBtn.style.padding = "4px 8px";
    prevBtn.style.fontSize = "16px";
    prevBtn.style.pointerEvents = "auto";
    prevBtn.setAttribute("data-action", "prev-month");
    prevBtn.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newDate = new Date(year, month - 1);
      this.renderCalendar(newDate);
    };

    const monthYear = document.createElement("div");
    monthYear.textContent = dayjs(date).format("MMMM YYYY");
    monthYear.style.fontWeight = "bold";
    monthYear.style.minWidth = "120px";
    monthYear.style.textAlign = "center";

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.textContent = "→";
    nextBtn.style.background = "none";
    nextBtn.style.border = "none";
    nextBtn.style.cursor = "pointer";
    nextBtn.style.padding = "4px 8px";
    nextBtn.style.fontSize = "16px";
    nextBtn.style.pointerEvents = "auto";
    nextBtn.setAttribute("data-action", "next-month");
    nextBtn.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newDate = new Date(year, month + 1);
      this.renderCalendar(newDate);
    };

    header.appendChild(prevBtn);
    header.appendChild(monthYear);
    header.appendChild(nextBtn);

    // Grid de dias da semana
    const weekDaysDiv = document.createElement("div");
    weekDaysDiv.style.display = "grid";
    weekDaysDiv.style.gridTemplateColumns = "repeat(7, 1fr)";
    weekDaysDiv.style.gap = "4px";
    weekDaysDiv.style.marginBottom = "8px";

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    for (const day of weekDays) {
      const dayEl = document.createElement("div");
      dayEl.textContent = day;
      dayEl.style.textAlign = "center";
      dayEl.style.fontSize = "12px";
      dayEl.style.fontWeight = "bold";
      dayEl.style.color = "#666";
      weekDaysDiv.appendChild(dayEl);
    }

    // Grid de datas
    const datesDiv = document.createElement("div");
    datesDiv.style.display = "grid";
    datesDiv.style.gridTemplateColumns = "repeat(7, 1fr)";
    datesDiv.style.gap = "4px";

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const today = new Date();
    const selectedDate = this.value || null;

    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);

      const dateBtn = document.createElement("button");
      dateBtn.type = "button";
      dateBtn.textContent = String(d.getDate());
      dateBtn.style.padding = "6px";
      dateBtn.style.border = "1px solid #ddd";
      dateBtn.style.borderRadius = "4px";
      dateBtn.style.cursor = "pointer";
      dateBtn.style.background = "white";
      dateBtn.style.fontSize = "12px";
      dateBtn.style.pointerEvents = "auto";

      const isCurrentMonth = d.getMonth() === month;
      const isToday =
        d.toDateString() === today.toDateString() && isCurrentMonth;
      const isSelected =
        selectedDate && d.toDateString() === selectedDate.toDateString();

      if (!isCurrentMonth) {
        dateBtn.style.color = "#ccc";
        dateBtn.disabled = true;
      }

      if (isToday) {
        dateBtn.style.background = "#3b82f6";
        dateBtn.style.color = "white";
        dateBtn.style.borderColor = "#3b82f6";
      }

      if (isSelected) {
        dateBtn.style.background = "#1e40af";
        dateBtn.style.color = "white";
        dateBtn.style.borderColor = "#1e40af";
      }

      dateBtn.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCurrentMonth) {
          const day = String(d.getDate()).padStart(2, "0");
          const mon = String(d.getMonth() + 1).padStart(2, "0");
          const yr = d.getFullYear();
          this.textValue = `${day}/${mon}/${yr}`;
          this.input.value = this.textValue;
          this.value = d;
          this.calendarOpen = false;
          this.calendarContainer.style.display = "none";
          // Salvar automaticamente
          this.params.stopEditing();
        }
      };

      datesDiv.appendChild(dateBtn);
    }

    this.calendarContainer.appendChild(header);
    this.calendarContainer.appendChild(weekDaysDiv);
    this.calendarContainer.appendChild(datesDiv);
  }

  getGui(): HTMLElement {
    this.container = document.createElement("div");
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.display = "flex";
    this.container.style.alignItems = "center";
    this.container.style.gap = "0";
    this.container.style.padding = "0";

    // Input de texto
    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.placeholder = "DD/MM/YYYY";
    this.input.value = this.textValue;
    this.input.style.width = "100%";
    this.input.style.height = "100%";
    this.input.style.padding = "0 8px";
    this.input.style.border = "none";
    this.input.style.outline = "none";
    this.input.style.fontFamily = "inherit";
    this.input.style.fontSize = "inherit";

    // Aplicar máscara enquanto digita
    const applyMask = (raw: string): string => {
      const digits = raw.replace(/\D/g, "").slice(0, 8);
      const parts = [] as string[];
      if (digits.length <= 2) return digits;
      parts.push(digits.slice(0, 2));
      if (digits.length <= 4) return `${parts[0]}/${digits.slice(2)}`;
      parts.push(digits.slice(2, 4));
      if (digits.length <= 8)
        return `${parts[0]}/${parts[1]}/${digits.slice(4)}`;
      return `${parts[0]}/${parts[1]}/${digits.slice(4, 8)}`;
    };

    const parseDate = (s: string): Date | null => {
      const d = dayjs(s, "DD/MM/YYYY", true);
      return d.isValid() ? d.toDate() : null;
    };

    // Evento de digitação com máscara
    this.input.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const masked = applyMask(target.value);
      this.input.value = masked;
      this.textValue = masked;
    });

    // Evento de paste para colar datas
    this.input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasted = e.clipboardData?.getData("text") || "";
      const masked = applyMask(pasted);
      this.input.value = masked;
      this.textValue = masked;
    });

    // Evento de tecla para Enter ou Escape
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        // Salvar se data está completa
        if (this.textValue.length === 10) {
          const parsed = parseDate(this.textValue);
          if (parsed) {
            this.value = parsed;
            this.params.stopEditing();
          }
        }
      } else if (e.key === "Escape") {
        if (this.calendarOpen) {
          this.calendarOpen = false;
          this.calendarContainer.style.display = "none";
        } else {
          this.params.stopEditing(true); // cancelar
        }
      }
    });

    // Container do calendário
    this.calendarContainer = document.createElement("div");
    this.calendarContainer.style.position = "fixed";
    this.calendarContainer.style.zIndex = "99999";
    this.calendarContainer.style.display = "none";
    this.calendarContainer.style.background = "white";
    this.calendarContainer.style.border = "1px solid #ccc";
    this.calendarContainer.style.borderRadius = "8px";
    this.calendarContainer.style.padding = "12px";
    this.calendarContainer.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
    this.calendarContainer.style.minWidth = "280px";
    this.calendarContainer.style.pointerEvents = "auto";
    this.calendarContainer.setAttribute(CALENDAR_MARKER_ATTR, "true");

    // Impedir que cliques no calendário disparem o close listener
    this.calendarContainer.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    this.calendarContainer.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    // Botão calendário
    const calendarBtn = document.createElement("button");
    calendarBtn.type = "button";
    calendarBtn.style.padding = "0 8px";
    calendarBtn.style.height = "100%";
    calendarBtn.style.border = "none";
    calendarBtn.style.background = "transparent";
    calendarBtn.style.cursor = "pointer";
    calendarBtn.style.display = "flex";
    calendarBtn.style.alignItems = "center";
    calendarBtn.style.justifyContent = "center";
    calendarBtn.style.minWidth = "40px";
    calendarBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

    calendarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.calendarOpen = !this.calendarOpen;
      if (this.calendarOpen) {
        // Calcular posição relativa à viewport
        const rect = calendarBtn.getBoundingClientRect();
        this.calendarContainer.style.display = "block";
        this.calendarContainer.style.top = rect.bottom + 4 + "px";
        this.calendarContainer.style.left = rect.left + "px";

        // Adicionar no body para evitar overflow hidden do AG-Grid
        if (!this.calendarContainer.parentElement) {
          document.body.appendChild(this.calendarContainer);
        }

        const displayDate = this.value || new Date();
        this.renderCalendar(displayDate);

        // Fechar ao clicar fora - remover listener anterior se existir
        if (this.closeListener) {
          document.removeEventListener("mousedown", this.closeListener, true);
        }

        this.closeListener = (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          const isClickInsideCalendar =
            this.calendarContainer && this.calendarContainer.contains(target);
          const isClickOnButton = calendarBtn && calendarBtn.contains(target);
          const isClickOnInput = this.input && this.input.contains(target);

          if (!isClickInsideCalendar && !isClickOnButton && !isClickOnInput) {
            // Clique foi fora - fechar calendário
            this.calendarOpen = false;
            this.calendarContainer.style.display = "none";
            document.removeEventListener(
              "mousedown",
              this.closeListener!,
              true,
            );
            this.closeListener = null;
          }
        };

        // Fase de captura: garante que o clique fora seja detectado mesmo se
        // algum outro elemento (ex.: outra célula do AG-Grid) chamar
        // stopPropagation() durante o bubbling — era essa a causa mais provável
        // do calendário "travar" sem fechar ao clicar fora.
        document.addEventListener("mousedown", this.closeListener, true);
      } else {
        this.calendarContainer.style.display = "none";
        if (this.closeListener) {
          document.removeEventListener("mousedown", this.closeListener, true);
          this.closeListener = null;
        }
      }
    });

    // Não adicionar listener global que conflita

    // Focar no input imediatamente
    setTimeout(() => {
      this.input.focus();
      this.input.select();
    }, 0);

    this.container.appendChild(this.input);
    this.container.appendChild(calendarBtn);

    // NÃO adicionar o calendário no container, ele será adicionado no body quando abrir

    return this.container;
  }

  getValue(): any {
    // Se o campo está vazio, retorna null
    if (!this.textValue || this.textValue.trim().length === 0) {
      return null;
    }

    // Se tem 10 caracteres (DD/MM/YYYY), tenta converter
    if (this.textValue.length === 10) {
      const d = dayjs(this.textValue, "DD/MM/YYYY", true);
      return d.isValid() ? d.toDate() : null;
    }
    return this.value;
  }

  isCancelBeforeStart(): boolean {
    return false;
  }

  isCancelAfterEnd(): boolean {
    return false;
  }

  isPopup(): boolean {
    return false;
  }

  focusIn(): void {
    this.input.focus();
    this.input.select();
  }

  destroy(): void {
    // Limpar listeners quando o editor for destruído
    if (this.closeListener) {
      document.removeEventListener("mousedown", this.closeListener, true);
      this.closeListener = null;
    }

    // Remover calendário do DOM se ainda estiver lá
    if (this.calendarContainer && this.calendarContainer.parentElement) {
      this.calendarContainer.parentElement.removeChild(this.calendarContainer);
    }

    // Segurança extra: se por algum motivo o AG-Grid não chamou destroy() a
    // tempo (ex.: linha reciclada durante a edição) e uma nova sessão de
    // edição já teria varrido órfãos no init(), varre de novo aqui também.
    removerCalendariosOrfaos();
  }
}
