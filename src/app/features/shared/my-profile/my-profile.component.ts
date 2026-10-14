import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DateEsPipe, IconComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Mi Perfil</h1>
      <p class="page-subtitle">Gestiona tu información personal</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Avatar card -->
      <div class="card p-6 text-center">
        <div class="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 overflow-hidden">
          @if (auth.currentUser()?.profilePhoto) {
            <img [src]="auth.currentUser()!.profilePhoto!" alt="Foto perfil" class="w-full h-full object-cover"/>
          } @else {
            <span class="text-4xl font-bold text-primary-700">
              {{ auth.currentUser()?.names?.charAt(0) | uppercase }}
            </span>
          }
        </div>
        <h2 class="font-bold text-text-primary text-lg">
          {{ auth.currentUser()?.names }} {{ auth.currentUser()?.surnames }}
        </h2>
        <p class="text-sm text-text-secondary">{{ auth.currentUser()?.email }}</p>
        <span class="badge badge-primary mt-2">{{ auth.currentUser()?.role?.name }}</span>

        <div class="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-left">
          <div class="flex justify-between">
            <span class="text-text-secondary">Documento</span>
            <span class="font-medium">{{ auth.currentUser()?.document }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-secondary">Estado</span>
            <span [ngClass]="auth.currentUser()?.state === 'ACTIVE' ? 'text-success font-medium' : 'text-danger font-medium'">
              {{ auth.currentUser()?.state }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-secondary">Registrado</span>
            <span class="font-medium text-xs">{{ auth.currentUser()?.registrationDate | dateEs:'short' }}</span>
          </div>
          @if (auth.currentUser()?.lastAccess) {
            <div class="flex justify-between">
              <span class="text-text-secondary">Último acceso</span>
              <span class="font-medium text-xs">{{ auth.currentUser()?.lastAccess | dateEs:'short' }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Edit Form -->
      <div class="lg:col-span-2 card p-6">
        <h2 class="text-lg font-bold mb-4">Editar información</h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Nombres *</label>
              <input type="text" formControlName="names" class="form-control"/>
              @if (f['names'].invalid && f['names'].touched) {
                <p class="form-error">Nombres requeridos.</p>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Apellidos *</label>
              <input type="text" formControlName="surnames" class="form-control"/>
              @if (f['surnames'].invalid && f['surnames'].touched) {
                <p class="form-error">Apellidos requeridos.</p>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="tel" formControlName="phone" class="form-control" placeholder="3001234567"/>
          </div>

          <div class="form-group">
            <label class="form-label">Dirección</label>
            <input type="text" formControlName="address" class="form-control" placeholder="Calle 1 #2-3"/>
          </div>

          <div class="form-group">
            <label class="form-label">URL foto de perfil</label>
            <input type="url" formControlName="profilePhoto" class="form-control"
                   placeholder="https://..."/>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              @if (saving()) {
                <app-icon name="loader" [size]="14" class="animate-spin"/> Guardando...
              } @else {
                <app-icon name="save" [size]="14"/> Guardar cambios
              }
            </button>
            <button type="button" (click)="reset()" class="btn btn-ghost">Restablecer</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class MyProfileComponent implements OnInit {
  private userSvc = inject(UserService);
  auth    = inject(AuthService);
  private toast   = inject(ToastService);
  private fb      = inject(FormBuilder);

  saving = signal(false);

  form = this.fb.group({
    names:        ['', Validators.required],
    surnames:     ['', Validators.required],
    phone:        [''],
    address:      [''],
    profilePhoto: ['']
  });
  get f() { return this.form.controls; }

  ngOnInit() { this.reset(); }

  reset() {
    const u = this.auth.currentUser();
    if (!u) return;
    this.form.patchValue({
      names:        u.names,
      surnames:     u.surnames,
      phone:        u.phone ?? '',
      address:      u.address ?? '',
      profilePhoto: u.profilePhoto ?? ''
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.userSvc.updateMe(this.form.value as any).subscribe({
      next: user => {
        this.auth.refreshCurrentUser(user);
        this.toast.success('Perfil actualizado correctamente');
        this.saving.set(false);
      },
      error: err => { this.toast.error(extractApiError(err)); this.saving.set(false); }
    });
  }
}
