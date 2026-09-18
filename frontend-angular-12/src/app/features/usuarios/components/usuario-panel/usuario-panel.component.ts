import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  CatalogoItem,
  Usuario,
  UsuarioConFichaDraft,
  UsuarioDraft,
  UsuarioStatus
} from '../../../../core/models/usuario.model';
import { Odontologo } from '../../../../core/models/odontologo.model';
import { UsuariosHttpService } from '../../services/usuarios-http.service';
import { AuthStore } from '../../../../core/auth/auth.store';

export function usuarioStatusLabel(status: UsuarioStatus): string {
  switch (status) {
    case 'activo':
      return 'ACCESO ACTIVO';
    case 'suspendido':
      return 'CUENTA SUSPENDIDA';
    case 'inactivo':
      return 'CUENTA INACTIVA';
    default:
      return status ? status.toUpperCase() : 'SIN ESTADO';
  }
}

@Component({
  selector: 'app-usuario-panel',
  templateUrl: './usuario-panel.component.html',
  styleUrls: ['./usuario-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioPanelComponent implements OnChanges {
  @Input() usuario: Usuario | null = null;
  @Input() creating = false;
  @Input() roles: CatalogoItem[] = [];
  @Input() estados: CatalogoItem[] = [];
  @Input() esAdmin = false;
  @Input() puedeEditar = false;
  @Input() puedeSuspender = false;
  @Input() odontologos: Odontologo[] = [];
  @Input() especialidades: CatalogoItem[] = [];
  @Input() turnos: CatalogoItem[] = [];
  @Input() consultorios: CatalogoItem[] = [];
  @Input() puedeCrearFicha = false;
  @Input() serverError: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<UsuarioDraft>();
  @Output() savedConFicha = new EventEmitter<UsuarioConFichaDraft>();
  @Output() toggle = new EventEmitter<string>();
  @Output() crearRol = new EventEmitter<string>();
  @Output() crearEstado = new EventEmitter<string>();

  editing = false;

  // Resultado de recuperación / reset (modal interno).
  resCodigo: string | null = null;
  resMinutos = 15;
  resTemporal: string | null = null;
  resMensaje: string | null = null;
  resError: string | null = null;
  operando = false;

  statusLabel = usuarioStatusLabel;

  constructor(
    private service: UsuariosHttpService,
    private auth: AuthStore,
    private readonly cdr: ChangeDetectorRef
  ) {}

  /** La ficha abierta es la cuenta con la que estoy autenticado. */
  esCuentaPropia(): boolean {
    const mio = this.auth.usuario?.code;
    return !!mio && !!this.usuario && this.usuario.code === mio;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.usuario || changes.creating) {
      this.editing = false;
      this.resError = null;
    }
  }

  startEdit(): void {
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  closeForm(): void {
    if (this.creating) {
      this.cancel.emit();
    } else {
      this.cancelEdit();
    }
  }

  onSaved(draft: UsuarioDraft): void {
    this.editing = false;
    this.saved.emit(draft);
  }

  onSavedConFicha(draft: UsuarioConFichaDraft): void {
    this.editing = false;
    this.savedConFicha.emit(draft);
  }

  /** Opción 2: emite el código de un solo uso para entregarlo al usuario. */
  generarCodigo(): void {
    const u = this.usuario;
    if (!u || this.operando) {
      return;
    }
    this.operando = true;
    this.resError = null;
    this.resCodigo = null;
    this.resTemporal = null;
    this.cdr.markForCheck();
    this.service.generarCodigoRecuperacion(u.code).subscribe({
      next: res => {
        this.resCodigo = res.codigo;
        this.resMinutos = res.expiraEnMinutos;
        this.operando = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.resError = err?.error?.message ?? 'NO SE PUDO GENERAR EL CÓDIGO';
        this.operando = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Opción 1: clave temporal + cambio obligatorio al próximo ingreso. */
  resetearClave(): void {
    const u = this.usuario;
    if (!u || this.operando) {
      return;
    }
    const confirma = window.confirm(
      `RESETEAR LA CLAVE DE ${u.name}?\nSE ENTREGARÁ UNA CLAVE TEMPORAL Y SE OBLIGARÁ EL CAMBIO EN EL PRÓXIMO INGRESO.`
    );
    if (!confirma) {
      return;
    }
    this.operando = true;
    this.resError = null;
    this.resCodigo = null;
    this.resTemporal = null;
    this.cdr.markForCheck();
    this.service.resetearClave(u.code).subscribe({
      next: res => {
        this.resTemporal = res.password;
        this.resMensaje = res.message;
        this.operando = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.resError = err?.error?.message ?? 'NO SE PUDO RESETEAR LA CLAVE';
        this.operando = false;
        this.cdr.markForCheck();
      }
    });
  }

  cerrarResultado(): void {
    this.resCodigo = null;
    this.resTemporal = null;
    this.resMensaje = null;
    this.resError = null;
    this.cdr.markForCheck();
  }

  copiarResultado(): void {
    const valor = this.resCodigo ?? this.resTemporal;
    if (!valor) {
      return;
    }
    navigator.clipboard?.writeText(valor).catch(() => undefined);
  }
}