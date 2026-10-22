import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-500 flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <!-- Brand -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <app-icon name="book-open" [size]="32" class="text-primary"/>
          </div>
          <h1 class="text-3xl font-bold text-white">Pape market</h1>
          <p class="text-blue-200 mt-1 text-sm">Sistema de Gestión</p>
        </div>

        <!-- Card -->
        <div class="card p-8">
          <h2 class="text-xl font-bold text-text-primary mb-6">Iniciar Sesión</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">

            <div class="form-group">
              <label class="form-label">Correo electrónico</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <app-icon name="mail" [size]="16"/>
                </span>
                <input type="email" formControlName="email"
                       class="form-control pl-9" placeholder="correo@ejemplo.com" autocomplete="email"/>
              </div>
              @if (f['email'].invalid && f['email'].touched) {
                <p class="form-error">Ingrese un correo válido.</p>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <app-icon name="lock" [size]="16"/>
                </span>
                <input [type]="showPwd() ? 'text' : 'password'" formControlName="password"
                       class="form-control pl-9 pr-10" placeholder="••••••" autocomplete="current-password"/>
                <button type="button" (click)="showPwd.set(!showPwd())"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <app-icon [name]="showPwd() ? 'eye-off' : 'eye'" [size]="16"/>
                </button>
              </div>
              @if (f['password'].invalid && f['password'].touched) {
                <p class="form-error">La contraseña es requerida.</p>
              }
            </div>

            <div class="flex justify-end text-sm">
              <a routerLink="/forgot-password" class="text-primary hover:underline font-medium">
                ¿Olvidó su contraseña?
              </a>
            </div>

            <button type="submit" class="btn btn-primary w-full btn-lg" [disabled]="loading()">
              @if (loading()) {
                <app-icon name="loader" [size]="16" class="animate-spin"/>
                Ingresando...
              } @else {
                Ingresar
              }
            </button>
          </form>

          <div class="divider"></div>
          <p class="text-center text-sm text-text-secondary">
            ¿No tiene cuenta?
            <a routerLink="/register" class="text-primary font-medium hover:underline ml-1">Registrarse</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth  = inject(AuthService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  showPwd = signal(false);
  loading = signal(false);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  get f() { return this.form.controls; }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.auth.login(this.form.value as any).subscribe({
      next: () => { this.toast.success('¡Bienvenido!'); this.auth.navigateByRole(); },
      error: err => { this.toast.error(extractApiError(err)); this.loading.set(false); }
    });
  }
}
