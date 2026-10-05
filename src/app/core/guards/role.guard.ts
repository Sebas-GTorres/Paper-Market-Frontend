import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (requiredRole: string): CanActivateFn =>
  (route: ActivatedRouteSnapshot) => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (auth.userRole() !== requiredRole) {
      router.navigate(['/forbidden']);
      return false;
    }

    return true;
  };
