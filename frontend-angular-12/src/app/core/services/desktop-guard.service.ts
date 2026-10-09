import { Injectable } from '@angular/core';

/**
 * Oculta los "tics" de navegador que delatan que la estación corre dentro de un
 * navegador en modo --app: menú contextual, zoom por teclado/rueda y el
 * arrastre de archivos sobre la ventana (que el navegador interpretaría como
 * "abrir este archivo").
 *
 * Es deliberadamente conservador: no toca nada que el usuario pueda necesitar
 * (copiar/pegar, corrector en las notas clínicas, drag&drop interno). El resto
 * de comportamientos —guardar contraseñas, DevTools, barra lateral de Edge— se
 * apagan por política del navegador, no desde aquí.
 */
@Injectable({ providedIn: 'root' })
export class DesktopGuardService {
  private instalado = false;

  /** Idempotente: se puede llamar varias veces sin duplicar los listeners. */
  instalar(): void {
    if (this.instalado) {
      return;
    }
    this.instalado = true;

    document.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('wheel', this.onWheel, { passive: false });
    document.addEventListener('dragover', this.onDragArchivo);
    document.addEventListener('drop', this.onDragArchivo);
  }

  /**
   * Menú contextual: se respeta sobre campos editables y sobre texto
   * seleccionado, de modo que copiar/pegar sigue funcionando (imprescindible en
   * un formulario clínico). En cualquier otro punto de la interfaz se anula.
   */
  private readonly onContextMenu = (e: MouseEvent): void => {
    if (this.esEditable(e.target) || this.haySeleccion()) {
      return;
    }
    e.preventDefault();
  };

  /**
   * Zoom: Ctrl +/-/0 y Ctrl+rueda (que incluye el gesto de pinza en pantallas
   * táctiles). Se ignora si hay Alt para no pisar atajos de la propia app.
   */
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) {
      return;
    }
    const k = e.key;
    if (k === '+' || k === '-' || k === '=' || k === '_' || k === '0') {
      e.preventDefault();
    }
  };

  private readonly onWheel = (e: WheelEvent): void => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  };

  /**
   * Arrastre de archivos: solo se cancela cuando lo arrastrado son archivos; el
   * drag&drop interno de la app (si algún día lo hubiera) queda intacto.
   */
  private readonly onDragArchivo = (e: DragEvent): void => {
    const tipos = e.dataTransfer ? Array.from(e.dataTransfer.types) : [];
    if (tipos.indexOf('Files') !== -1) {
      e.preventDefault();
    }
  };

  private esEditable(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el || typeof el.tagName !== 'string') {
      return false;
    }
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
  }

  private haySeleccion(): boolean {
    const sel = window.getSelection();
    return !!sel && sel.toString().length > 0;
  }
}