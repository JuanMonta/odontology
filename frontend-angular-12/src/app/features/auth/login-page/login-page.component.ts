import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { APP_ROUTES } from '../../../core/config/app-routes';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent implements OnInit {
  username = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(
    private auth: AuthStore,
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
    this.cdr.markForCheck();
    this.auth
      .login(this.username.trim(), this.password)
      .then(() => {
        this.router.navigate([APP_ROUTES.dashboard]);
      })
      .catch((err: { status?: number }) => {
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
}
