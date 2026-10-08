import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-500 flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-primary">
            <app-icon name="lock" [size]="30"/>
          </div>
          <h1 class="text-3xl font-bold text-white">Nueva Contraseña</h1>
        </div>

        <div class="card p-8">
          <h2 class="text-xl font-bold text-text-primary mb-6">Restablecer contraseña</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">

            <!-- Campo token oculto — se llena automáticamente desde la URL -->
            <input type="hidden" formControlName="token"/>

            <div class="form-group">
              <label class="form-label">Nueva contraseña</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <app-icon name="lock" [size]="16"/>
                </span>
                <input [type]="showPwd() ? 'text' : 'password'" formControlName="newPassword"
                       class="form-control pl-9 pr-10" placeholder="Mínimo 6 caracteres"/>
                <button type="button" (click)="showPwd.set(!showPwd())"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <app-icon [name]="showPwd() ? 'eye-off' : 'eye'" [size]="16"/>
                </button>
              </div>
              @if (f['newPassword'].invalid && f['newPassword'].touched) {
                <p class="form-error">La contraseña debe tener al menos 6 caracteres.</p>
              }
            </div>

            <button type="submit" class="btn btn-primary w-full btn-lg" [disabled]="loading()">
              @if (loading()) {
                <app-icon name="loader" [size]="16" class="animate-spin"/> Guardando...
              } @else {
                <app-icon name="save" [size]="16"/> Guardar nueva contraseña
              }
            </button>

          </form>

          <div class="divider"></div>
          <p class="text-center text-sm">
            <a routerLink="/login" class="text-primary font-medium hover:underline flex items-center justify-center gap-1">
              <app-icon name="arrow-left" [size]="14"/> Volver al inicio de sesión
            </a>
          </p>
        </div>

      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private fb     = inject(FormBuilder);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  showPwd = signal(false);
  loading = signal(false);

  // El campo token está en el FormGroup pero no es visible para el usuario
  form = this.fb.group({
    token:       ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });
  get f() { return this.form.controls; }

  ngOnInit() {
    // Lee el token automáticamente del enlace del correo
    // Ejemplo de URL: /reset-password?token=2478641a-0f55-4b12-aa1f-6a7ad676f68b
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.form.patchValue({ token });
    } else {
      this.toast.error('El enlace de recuperación no es válido o ha expirado.');
      this.router.navigate(['/login']);
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { token, newPassword } = this.form.value;
    this.auth.resetPassword({ token: token!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Contraseña actualizada correctamente. Ya puede iniciar sesión.');
        this.router.navigate(['/login']);
      },
      error: err => {
        this.toast.error(extractApiError(err));
        this.loading.set(false);
      }
    });
  }
}
