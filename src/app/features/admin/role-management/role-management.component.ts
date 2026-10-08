import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../core/services/toast.service';
import { RoleResponse } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header flex-row justify-between items-start">
      <div>
        <h1 class="page-title">Roles</h1>
        <p class="page-subtitle">Gestión de roles del sistema</p>
      </div>
      <button (click)="showModal.set(true)" class="btn btn-primary mt-1">+ Nuevo Rol</button>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else if (roles().length === 0) {
      <app-empty-state icon="" title="Sin roles" subtitle="No hay roles configurados."/>
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (role of roles(); track role.id) {
          <div class="card p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <app-icon name="key" [size]="22"/>
              </div>
              <div>
                <p class="font-bold text-text-primary">{{ role.name }}</p>
                <p class="text-xs text-text-secondary">ID: {{ role.id }}</p>
              </div>
            </div>
            <p class="text-sm text-text-secondary">{{ role.description || '—' }}</p>
          </div>
        }
      </div>
    }

    <!-- Create Modal -->
    @if (showModal()) {
      <div class="overlay" (click)="closeModal()">
        <div class="modal modal-sm p-6" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold mb-4">Nuevo Rol</h3>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div class="form-group">
              <label class="form-label">Nombre del rol *</label>
              <input type="text" formControlName="name" class="form-control" placeholder="Ej: SUPERVISOR"/>
              @if (form.controls['name'].invalid && form.controls['name'].touched) {
                <p class="form-error">Nombre requerido.</p>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Descripción *</label>
              <input type="text" formControlName="description" class="form-control" placeholder="Descripción del rol"/>
              @if (form.controls['description'].invalid && form.controls['description'].touched) {
                <p class="form-error">Descripción requerida.</p>
              }
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) {
                  <app-icon name="loader" [size]="14" class="animate-spin"/>
                } @else {
                  Crear Rol
                }
              </button>
              <button type="button" (click)="closeModal()" class="btn btn-ghost">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class RoleManagementComponent implements OnInit {
  private roleSvc = inject(RoleService);
  private toast   = inject(ToastService);
  private fb      = inject(FormBuilder);

  roles     = signal<RoleResponse[]>([]);
  loading   = signal(true);
  showModal = signal(false);
  saving    = signal(false);

  form = this.fb.group({
    name:        ['', Validators.required],
    description: ['', Validators.required]
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.roleSvc.getAll().subscribe({
      next: r  => { this.roles.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  closeModal() { this.showModal.set(false); this.form.reset(); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const { name, description } = this.form.value;
    this.roleSvc.create(name!, description!).subscribe({
      next: () => { this.toast.success('Rol creado exitosamente'); this.closeModal(); this.loadAll(); this.saving.set(false); },
      error: err => { this.toast.error(extractApiError(err)); this.saving.set(false); }
    });
  }
}
