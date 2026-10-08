import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="min-h-screen bg-background flex items-center justify-center p-4">
      <div class="text-center max-w-md">
        <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-danger">
          <app-icon name="ban" [size]="48"/>
        </div>
        <h1 class="text-5xl font-bold text-danger mb-2">403</h1>
        <h2 class="text-xl font-semibold text-text-primary mb-3">Acceso Denegado</h2>
        <p class="text-text-secondary mb-8">
          No tiene permisos para acceder a esta sección.
          Contacte al administrador si cree que esto es un error.
        </p>
        <div class="flex gap-3 justify-center flex-wrap">
          @if (auth.isAuthenticated()) {
            <button (click)="auth.navigateByRole()" class="btn btn-primary">
              Ir a mi página principal
            </button>
          }
          <a routerLink="/login" class="btn btn-outline">Iniciar Sesión</a>
        </div>
      </div>
    </div>
  `
})
export class ForbiddenComponent {
  auth = inject(AuthService);
}
