import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthStore } from './auth.store';

/**
 * Bloquea las rutas que exigen sesión (chat, y en el futuro el resto). Sin
 * token redirige al muelle de login.
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthStore, private readonly router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.isLoggedIn()) {
      return true;
    }
    return this.router.createUrlTree(['/login']);
  }
}
