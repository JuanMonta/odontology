import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  CatalogoItem,
  Usuario,
  UsuarioConFichaDraft,
  UsuarioDraft,
  UsuarioRol,
  UsuarioStatus
} from '../../../../core/models/usuario.model';
import { Odontologo, OdontologoDraft } from '../../../../core/models/odontologo.model';
import { UiPassChecklistComponent } from '../../../../shared/ui/ui-pass-checklist/ui-pass-checklist.component';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.css', '../../../../shared/styles/cat-inline.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioFormComponent implements OnChanges {
  @Input() usuario: Usuario | null = null;
  @Input() roles: CatalogoItem[] = [];
  @Input() estados: CatalogoItem[] = [];
  @Input() esAdmin = false;
  @Input() odontologos: Odontologo[] = [];
  @Input() especialidades: CatalogoItem[] = [];
  @Input() turnos: CatalogoItem[] = [];
  @Input() consultorios: CatalogoItem[] = [];
  @Input() puedeCrearFicha = false;
  @Input() serverError: string | null = null;
  @Output() saved = new EventEmitter<UsuarioDraft>();
  @Output() savedConFicha = new EventEmitter<UsuarioConFichaDraft>();
  @Output() cancel = new EventEmitter<void>();
  @Output() crearRol = new EventEmitter<string>();
  @Output() crearEstado = new EventEmitter<string>();

  username = '';
  name = '';
  role: UsuarioRol = '';
  status: UsuarioStatus = '';
  odontologoCodigo: string | null = null;
  email = '';
  password = '';
  error = false;
  errorMsg = 'USUARIO Y NOMBRE SON OBLIGATORIOS';

  nuevoRol = '';
  nuevoEstado = '';
  creandoRol = false;
  creandoEstado = false;
  creandoFicha = false;

  fichaNombre = '';
  fichaEspecialidad = '';
  fichaLicencia = '';
  fichaTurno = '';
  fichaConsultorio = '';

  private pendienteRol: string | null = null;
  private pendienteEstado: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.usuario && this.usuario) {
      this.username = this.usuario.username;
      this.name = this.usuario.name;
      this.role = this.usuario.role;
      this.status = this.usuario.status;
      this.odontologoCodigo = this.usuario.odontologoCodigo || null;
      this.email = this.usuario.email ?? '';
      this.error = false;
    }
    if (changes.roles) {
      if (this.pendienteRol && this.roles.some(r => r.nombre === this.pendienteRol)) {
        this.role = this.pendienteRol;
        this.pendienteRol = null;
      }
      if (this.roles.length && !this.role) {
        this.role = this.roles[0].nombre;
      }
    }
    if (changes.estados) {
      if (this.pendienteEstado && this.estados.some(e => e.nombre === this.pendienteEstado)) {
        this.status = this.pendienteEstado;
        this.pendienteEstado = null;
      }
      if (this.estados.length && !this.status) {
        this.status = this.estados[0].nombre;
      }
    }
    if (changes.especialidades && this.especialidades.length && !this.fichaEspecialidad) {
      this.fichaEspecialidad = this.especialidades[0].nombre;
    }
    if (changes.turnos && this.turnos.length && !this.fichaTurno) {
      this.fichaTurno = this.turnos[0].nombre;
    }
    if (changes.consultorios && this.consultorios.length && !this.fichaConsultorio) {
      this.fichaConsultorio = this.consultorios[0].codigo;
    }
  }

  toggleFicha(): void {
    this.creandoFicha = !this.creandoFicha;
    this.creandoRol = false;
    this.creandoEstado = false;
    if (this.creandoFicha && !this.fichaNombre.trim()) {
      this.fichaNombre = this.name.trim().toUpperCase();
    }
  }

  onCrearRol(): void {
    const nombre = this.nuevoRol.trim().toLowerCase();
    if (!nombre) {
      return;
    }
    this.creandoRol = false;
    this.pendienteRol = nombre;
    this.nuevoRol = '';
    this.crearRol.emit(nombre);
  }

  onCrearEstado(): void {
    const nombre = this.nuevoEstado.trim().toLowerCase();
    if (!nombre) {
      return;
    }
    this.creandoEstado = false;
    this.pendienteEstado = nombre;
    this.nuevoEstado = '';
    this.crearEstado.emit(nombre);
  }

  onSubmit(): void {
    if (!this.username.trim() || !this.name.trim()) {
      this.errorMsg = 'USUARIO Y NOMBRE SON OBLIGATORIOS';
      this.error = true;
      return;
    }
    // Alta con clave inicial: debe cumplir la misma política del backend.
    if (!this.usuario && this.password && !UiPassChecklistComponent.isValid(this.password)) {
      this.errorMsg = 'LA CLAVE NO CUMPLE LAS 4 REGLAS DE SEGURIDAD';
      this.error = true;
      return;
    }
    this.error = false;
    const draft: UsuarioDraft = {
      username: this.username.trim().toLowerCase().replace(/\s+/g, ''),
      name: this.name.trim().toUpperCase(),
      role: this.role,
      status: this.status,
      odontologoCodigo: this.odontologoCodigo,
      email: this.email.trim() || null,
      password: !this.usuario && this.password ? this.password : null
    };
    // Alta unificada: ficha profesional inline para roles clínicos.
    if (!this.usuario && this.creandoFicha) {
      if (!this.fichaNombre.trim() || !this.fichaEspecialidad || !this.fichaTurno || !this.fichaLicencia.trim()) {
        this.errorMsg = 'FICHA: NOMBRE, ESPECIALIDAD, LICENCIA Y TURNO SON OBLIGATORIOS';
        this.error = true;
        return;
      }
      const ficha: OdontologoDraft = {
        name: this.fichaNombre.trim().toUpperCase(),
        specialty: this.fichaEspecialidad,
        license: this.fichaLicencia.trim().toUpperCase(),
        consultorio: this.fichaConsultorio,
        turno: this.fichaTurno,
        status: 'activo'
      };
      this.savedConFicha.emit({ usuario: draft, ficha });
      return;
    }
    this.saved.emit(draft);
  }
}
