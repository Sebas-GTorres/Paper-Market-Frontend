import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-500 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-primary">
            <app-icon name="key" [size]="30"/>
          </div>
          <h1 class="text-3xl font-bold text-white">Recuperar Contrasena</h1>
        </div>

        <div class="card p-8">
          @if (!sent()) {
            <h2 class="text-xl font-bold text-text-primary mb-2">Olvide mi contrasena</h2>
            <p class="text-sm text-text-secondary mb-6">
              Ingrese su correo y le enviaremos un enlace para restablecer su contrasena.
            </p>
            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
              <div class="form-group">
                <label class="form-label">Correo electronico</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <app-icon name="mail" [size]="16"/>
                  </span>
                  <input type="email" formControlName="email" class="form-control pl-9"
                         placeholder="correo@ejemplo.com"/>
                </div>
                @if (f['email'].invalid && f['email'].touched) {
                  <p class="form-error">Ingrese un correo valido.</p>
                }
              </div>
              <button type="submit" class="btn btn-primary w-full btn-lg" [disabled]="loading()">
                @if (loading()) {
                  <app-icon name="loader" [size]="16" class="animate-spin"/> Enviando...
                } @else {
                  <app-icon name="send" [size]="16"/> Enviar enlace
                }
              </button>
            </form>
          } @else {
            <div class="text-center py-4">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <app-icon name="mail" [size]="32"/>
              </div>
              <h3 class="text-lg font-semibold text-text-primary mb-2">Correo enviado</h3>
              <p class="text-sm text-text-secondary">
                Revise su bandeja de entrada y siga el enlace para restablecer su contrasena.
              </p>
            </div>
          }

          <div class="divider"></div>
          <p class="text-center text-sm">
            <a routerLink="/login" class="text-primary font-medium hover:underline flex items-center justify-center gap-1">
              <app-icon name="arrow-left" [size]="14"/> Volver al inicio de sesion
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private auth  = inject(AuthService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  loading = signal(false);
  sent    = signal(false);

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  get f() { return this.form.controls; }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.auth.forgotPassword(this.form.value as any).subscribe({
      next: () => { this.sent.set(true); this.loading.set(false); },
      error: err => { this.toast.error(extractApiError(err)); this.loading.set(false); }
    });
  }
}
