import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Redirects already-authenticated users away from public pages (login, register) */
export const redirectIfLoggedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    auth.navigateByRole();
    return false;
  }
  return true;
};
