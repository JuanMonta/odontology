import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { AuthApiService } from '../services/auth-api.service';
import { APP_ROUTES } from '../../../core/config/app-routes';
import { UiPassChecklistComponent } from '../../../shared/ui/ui-pass-checklist/ui-pass-checklist.component';

type AccesoModo = 'login' | 'recuperar' | 'forzado';

/**
 * Acceso del personal. Tres modos sobre el mismo tablero:
 *  - login: identificación normal (lo que venía).
 *  - recuperar: "¿OLVIDASTE TU CLAVE?" → canjea el código de un solo uso emitido
 *    por el admin (Opción 2) y define una clave nueva.
 *  - forzado: tras un reset por admin (Opción 1) el login devuelve 403
 *    DEBE_CAMBIAR_CLAVE; el ingreso con la clave temporal bloquea la navegación
 *    hasta redefinir la contraseña.
 */
@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent implements OnInit {
  modo: AccesoModo = 'login';

  username = '';
  password = '';
  loading = false;
  error: string | null = null;
  okMsg: string | null = null;

  recUsername = '';
  recCodigo = '';
  recNueva = '';
  recConfirmar = '';

  forzadoUsername = '';
  forzadoActual = '';
  forzadoNueva = '';
  forzadoConfirmar = '';

  constructor(
    private auth: AuthStore,
    private authApi: AuthApiService,
    private router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate([APP_ROUTES.dashboard]);
    }
  }

  onSubmit(): void {
    if (this.loading || !this.username.trim() || !this.password) {
      return;
    }
    this.loading = true;
    this.error = null;
    this.okMsg = null;
    this.cdr.markForCheck();
    this.auth
      .login(this.username.trim(), this.password)
      .then(() => {
        this.router.navigate([APP_ROUTES.dashboard]);
      })
      .catch((err: { status?: number; error?: { message?: string } }) => {
        if (err && err.status === 403) {
          // Reset por admin: la clave temporal solo habilita redefinir la clave.
          this.forzadoUsername = this.username.trim();
          this.modo = 'forzado';
          return;
        }
        if (err && err.status === 429) {
          this.error = err.error?.message ?? 'DEMASIADOS INTENTOS — REINTENTA EN ALGUNOS MINUTOS';
          return;
        }
        this.error =
          err && err.status === 401
            ? 'ACCESO DENEGADO — USUARIO O CONTRASEÑA INCORRECTOS'
            : 'ERROR DE CONEXIÓN — NO SE PUDO ESTABLECER CONTACTO CON EL SERVIDOR';
      })
      .finally(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  /** Cambio forzado (clave temporal del reset por admin). */
  onForzadoSubmit(): void {
    if (this.loading) {
      return;
    }
    const valida = this.validarNuevaClave(this.forzadoNueva, this.forzadoConfirmar);
    if (valida) {
      this.error = valida;
      return;
    }
    this.loading = true;
    this.error = null;
    this.okMsg = null;
    this.cdr.markForCheck();
    this.authApi
      .cambiarClave(this.forzadoUsername.trim(), this.forzadoActual, this.forzadoNueva)
      .toPromise()
      .then(() => this.auth.login(this.forzadoUsername.trim(), this.forzadoNueva))
      .then(() => this.router.navigate([APP_ROUTES.dashboard]))
      .catch((err: { status?: number }) => {
        this.error =
          err && err.status === 403
            ? 'CONTRASEÑA ACTUAL INCORRECTA — VERIFICA LA CLAVE TEMPORAL'
            : this.errorDeServidor(err);
      })
      .finally(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  abrirRecuperar(): void {
    if (this.loading) {
      return;
    }
    this.recUsername = this.username.trim();
    this.error = null;
    this.okMsg = null;
    this.modo = 'recuperar';
    this.cdr.markForCheck();
  }

  volverAlAcceso(): void {
    this.modo = 'login';
    this.error = null;
    this.okMsg = null;
    this.cdr.markForCheck();
  }

  /** Canje del código de un solo uso (Opción 2). */
  onRecuperarSubmit(): void {
    if (this.loading) {
      return;
    }
    const valida = this.validarNuevaClave(this.recNueva, this.recConfirmar);
    if (valida) {
      this.error = valida;
      return;
    }
    if (!/^\d{6}$/.test(this.recCodigo.trim())) {
      this.error = 'EL CÓDIGO DE RECUPERACIÓN SON 6 DÍGITOS';
      return;
    }
    this.loading = true;
    this.error = null;
    this.okMsg = null;
    this.cdr.markForCheck();
    this.authApi
      .reestablecerClave(this.recUsername.trim(), this.recCodigo.trim(), this.recNueva)
      .toPromise()
      .then(() => {
        this.modo = 'login';
        this.username = this.recUsername.trim();
        this.password = this.recNueva;
        this.okMsg = 'CLAVE RESTABLECIDA — INGRESA CON TU NUEVA CONTRASEÑA';
      })
      .catch((err: { status?: number }) => {
        this.error = this.errorDeServidor(err);
      })
      .finally(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  private validarNuevaClave(nueva: string, confirmar: string): string | null {
    if (!UiPassChecklistComponent.isValid(nueva)) {
      return 'LA NUEVA CLAVE DEBE TENER MÍNIMO 8 CARACTERES, 1 MAYÚSCULA, 1 NÚMERO Y 1 SÍMBOLO';
    }
    if (nueva !== confirmar) {
      return 'LAS CONTRASEÑAS NUEVAS NO COINCIDEN';
    }
    return null;
  }

  private errorDeServidor(err: { status?: number }): string {
    if (err && (err.status ?? 0) >= 400) {
      const body = (err as { error?: { message?: string } }).error;
      return body && body.message ? body.message : 'PETICIÓN RECHAZADA — REVISA LOS DATOS';
    }
    return 'ERROR DE CONEXIÓN — NO SE PUDO ESTABLECER CONTACTO CON EL SERVIDOR';
  }
}