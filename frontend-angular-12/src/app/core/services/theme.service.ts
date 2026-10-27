import { ApplicationRef, Injector, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthStore } from '../auth/auth.store';

export type Tema = 'carta' | 'clinica' | 'concourse';

/** Punto de origen (p. ej. el botón pulsado) desde el que se expande el tema. */
export interface OrigenTema {
  x: number;
  y: number;
}

interface DocumentoConTransicion extends Document {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
}

export interface TemaMeta {
  id: Tema;
  nombre: string;
  descripcion: string;
}

export const TEMAS: TemaMeta[] = [
  {
    id: 'carta',
    nombre: 'Carta clínica',
    descripcion: 'Papel claro y código de estados por color. Lectura de historia clínica.'
  },
  {
    id: 'clinica',
    nombre: 'Consultorio',
    descripcion: 'Blanco y azul de recepción, franjas celestes. La misma hoja, en tono de consultorio.'
  },
  {
    id: 'concourse',
    nombre: 'Tablero',
    descripcion: 'Tablero split-flap oscuro con solapas y acero cepillado.'
  }
];

const CLAVE_USUARIO = 'saas.clinica.tema.';
const CLAVE_ESTACION = 'saas.clinica.tema';
const DEFECTO: Tema = 'carta';

/**
 * Tema visual por operador. El atributo `data-theme` en <html> selecciona el
 * bloque de tokens; todas las reglas de `styles.css` y `themes/` reaccionan a
 * ese atributo. El script de arranque de `index.html` aplica el último tema de
 * la estación antes del primer pintado, para que no haya destello.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly tema$ = new BehaviorSubject<Tema>(this.leerEstacion());
  private codigoUsuario = 'anon';

  readonly temaActual$: Observable<Tema> = this.tema$.asObservable();
  readonly temas = TEMAS;

  constructor(auth: AuthStore, private readonly injector: Injector) {
    this.aplicar(this.tema$.getValue());
    auth.usuario$().subscribe(u => {
      this.codigoUsuario = u?.code || u?.username || 'anon';
      this.aplicar(this.leerUsuario() ?? this.tema$.getValue());
    });
  }

  get tema(): Tema {
    return this.tema$.getValue();
  }

  /** Reafirma el tema activo; se llama al arrancar la aplicación. */
  iniciar(): void {
    this.aplicar(this.tema$.getValue());
  }

  /**
   * Cambia de tema revelándolo con un círculo que se expande desde `origen`
   * (View Transitions). Si el navegador no lo soporta o el usuario pidió menos
   * movimiento, cae a un fundido corto de colores.
   */
  fijar(tema: Tema, origen?: OrigenTema): void {
    if (tema === this.tema$.getValue()) {
      return;
    }

    const aplicar = () => {
      this.persistir(tema);
      this.aplicar(tema);
      // Fija el DOM (p. ej. el botón activo) antes de que el navegador tome
      // la instantánea "nueva" de la transición.
      this.injector.get(ApplicationRef).tick();
    };

    const doc = document as DocumentoConTransicion;
    const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!doc.startViewTransition || menosMovimiento) {
      this.transicionSuave(aplicar);
      return;
    }

    const x = origen?.x ?? window.innerWidth / 2;
    const y = origen?.y ?? 0;
    const radio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const raiz = document.documentElement;

    raiz.style.setProperty('--tema-x', `${x}px`);
    raiz.style.setProperty('--tema-y', `${y}px`);
    raiz.style.setProperty('--tema-r', `${radio}px`);

    doc.startViewTransition(aplicar);
  }

  private persistir(tema: Tema): void {
    try {
      localStorage.setItem(CLAVE_USUARIO + this.codigoUsuario, tema);
      localStorage.setItem(CLAVE_ESTACION, tema);
    } catch {
      // almacenamiento no disponible: se aplica solo en memoria
    }
  }

  /** Fundido de colores para navegadores sin View Transitions. */
  private transicionSuave(aplicar: () => void): void {
    const raiz = document.documentElement;
    raiz.classList.add('tema-fundido');
    void raiz.offsetWidth;
    aplicar();
    setTimeout(() => raiz.classList.remove('tema-fundido'), 420);
  }

  private leerUsuario(): Tema | null {
    try {
      return this.normalizar(localStorage.getItem(CLAVE_USUARIO + this.codigoUsuario));
    } catch {
      return null;
    }
  }

  private leerEstacion(): Tema {
    try {
      return this.normalizar(localStorage.getItem(CLAVE_ESTACION)) ?? DEFECTO;
    } catch {
      return DEFECTO;
    }
  }

  private normalizar(valor: string | null): Tema | null {
    return TEMAS.some(t => t.id === valor) ? (valor as Tema) : null;
  }

  private aplicar(tema: Tema): void {
    document.documentElement.setAttribute('data-theme', tema);
    this.tema$.next(tema);
  }
}
