import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthStore } from './auth.store';
import { APP_ROUTES } from '../config/app-routes';

/**
 * Puerta por permiso RBAC. Cada ruta declara `data: { permiso: 'XXX_VER' }`;
 * sin el permiso (o SUPER_ADMIN) redirige a la agenda. Solo refleja la
 * decisión del backend, nunca la sustituye.
 */
@Injectable({ providedIn: 'root' })
export class PermisoGuard implements CanActivate {
  constructor(private readonly auth: AuthStore, private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const permiso = route.data?.['permiso'] as string | undefined;
    if (!this.auth.isLoggedIn()) {
      return this.router.createUrlTree([APP_ROUTES.login]);
    }
    if (permiso && !this.auth.tienePermiso(permiso)) {
      return this.router.createUrlTree([APP_ROUTES.dashboard]);
    }
    return true;
  }
}
