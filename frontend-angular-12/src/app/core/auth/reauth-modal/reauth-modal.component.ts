import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthStore } from '../auth.store';
import { ReauthService } from '../reauth.service';

/**
 * Prompt global de reinicio de sesión (401). Se monta en AppComponent para
 * cubrir cualquier página con difuminado de fondo: el operador ve el tablero
 * oculto detrás del blur y re-ingresa credenciales sin perder la pantalla ni el
 * formulario que estaba registrando.
 */
@Component({
  selector: 'app-reauth-modal',
  templateUrl: './reauth-modal.component.html',
  styleUrls: ['./reauth-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReauthModalComponent implements AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  visible = false;
  username = '';
  password = '';
  loading = false;
  error: string | null = null;

  @ViewChild('pwd', { static: false }) pwd: ElementRef<HTMLInputElement> | null = null;

  @HostBinding('class.is-open') get open(): boolean {
    return this.visible;
  }

  constructor(
    private readonly auth: AuthStore,
    private readonly reauth: ReauthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.reauth.visible().pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.visible = v;
      if (v) {
        this.username = this.auth.usuario?.username ?? '';
        this.password = '';
        this.loading = false;
        this.error = null;
      }
      this.cdr.markForCheck();
      if (v) {
        setTimeout(() => this.pwd?.nativeElement.focus(), 80);
      }
    });
  }

  onSubmit(): void {
    if (this.loading || !this.username.trim() || !this.password) {
      this.error = 'INGRESE USUARIO Y CONTRASEÑA';
      return;
    }
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.auth
      .login(this.username.trim(), this.password)
      .then(() => this.reauth.completado())
      .catch((e: { status?: number }) => {
        this.error =
          e && e.status === 401
            ? 'USUARIO O CONTRASEÑA INCORRECTOS'
            : 'NO SE PUDO CONTACTAR EL SERVIDOR — INTENTE NUEVAMENTE';
      })
      .finally(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  cancelar(): void {
    this.reauth.cancelar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}