import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-500 flex items-center justify-center p-4">
      <div class="w-full max-w-lg">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <app-icon name="user-plus" [size]="30" class="text-primary"/>
          </div>
          <h1 class="text-3xl font-bold text-white">Pape market</h1>
          <p class="text-blue-200 mt-1 text-sm">Crear nueva cuenta</p>
        </div>

        <div class="card p-8">
          <h2 class="text-xl font-bold text-text-primary mb-6">Registro de Cliente</h2>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Nombres *</label>
                <input type="text" formControlName="names" class="form-control" placeholder="Juan"/>
                @if (f['names'].invalid && f['names'].touched) {
                  <p class="form-error">Nombres requeridos.</p>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Apellidos *</label>
                <input type="text" formControlName="surnames" class="form-control" placeholder="Pérez"/>
                @if (f['surnames'].invalid && f['surnames'].touched) {
                  <p class="form-error">Apellidos requeridos.</p>
                }
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Documento de identidad *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><app-icon name="id-card" [size]="16"/></span>
                <input type="text" formControlName="document" class="form-control pl-9" placeholder="1234567890" maxlength="10"/>
              </div>
              @if (f['document'].invalid && f['document'].touched) {
                <p class="form-error">Documento requerido (máx. 10 caracteres).</p>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Correo electrónico *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><app-icon name="mail" [size]="16"/></span>
                <input type="email" formControlName="email" class="form-control pl-9" placeholder="correo@ejemplo.com"/>
              </div>
              @if (f['email'].invalid && f['email'].touched) {
                <p class="form-error">Correo válido requerido.</p>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><app-icon name="lock" [size]="16"/></span>
                <input [type]="showPwd() ? 'text' : 'password'" formControlName="password"
                       class="form-control pl-9 pr-10" placeholder="Mínimo 6 caracteres"/>
                <button type="button" (click)="showPwd.set(!showPwd())"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <app-icon [name]="showPwd() ? 'eye-off' : 'eye'" [size]="16"/>
                </button>
              </div>
              @if (f['password'].invalid && f['password'].touched) {
                <p class="form-error">Contraseña mínimo 6 caracteres.</p>
              }
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><app-icon name="phone" [size]="16"/></span>
                  <input type="tel" formControlName="phone" class="form-control pl-9" placeholder="3001234567"/>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Dirección</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><app-icon name="map-pin" [size]="16"/></span>
                  <input type="text" formControlName="address" class="form-control pl-9" placeholder="Calle 1 #2-3"/>
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-full btn-lg" [disabled]="loading()">
              @if (loading()) {
                <app-icon name="loader" [size]="16" class="animate-spin"/> Registrando...
              } @else {
                Crear Cuenta
              }
            </button>
          </form>

          <div class="divider"></div>
          <p class="text-center text-sm text-text-secondary">
            ¿Ya tiene cuenta?
            <a routerLink="/login" class="text-primary font-medium hover:underline ml-1">Iniciar Sesión</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private fb     = inject(FormBuilder);
  private router = inject(Router);        // ✅ inyecta Router aquí directamente

  showPwd = signal(false);
  loading = signal(false);

  form = this.fb.group({
    names:    ['', Validators.required],
    surnames: ['', Validators.required],
    document: ['', [Validators.required, Validators.maxLength(10)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone:    [''],
    address:  [''],
    roleId:   [3]
  });
  get f() { return this.form.controls; }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const invalid = Object.entries(this.form.controls)
        .filter(([, ctrl]) => ctrl.invalid)
        .map(([key]) => key);
      this.toast.warning(`Campos inválidos: ${invalid.join(', ')}`);
      return;
    }
    this.loading.set(true);
    this.auth.register(this.form.value as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Cuenta creada. Inicia sesión para continuar.');
        this.router.navigate(['/login']);  
      },
      error: err => {
        this.toast.error(extractApiError(err));
        this.loading.set(false);
      }
    });
  }
}

