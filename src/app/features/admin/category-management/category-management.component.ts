import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { CategoryResponse } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header flex-row justify-between items-start">
      <div>
        <h1 class="page-title">Categorías</h1>
        <p class="page-subtitle">Gestión de categorías de productos</p>
      </div>
      <button (click)="openCreate()" class="btn btn-primary mt-1">+ Nueva Categoría</button>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else if (categories().length === 0) {
      <app-empty-state icon="" title="Sin categorías" subtitle="Crea la primera categoría."/>
    } @else {
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (cat of categories(); track cat.id) {
              <tr>
                <td class="font-medium">{{ cat.name }}</td>
                <td class="text-sm text-text-secondary">{{ cat.description || '—' }}</td>
                <td>
                  <span [ngClass]="cat.status ? 'badge-success' : 'badge-gray'" class="badge">
                    {{ cat.status ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-1">
                    <button (click)="openEdit(cat)" class="btn btn-ghost btn-sm">
                      <app-icon name="pencil" [size]="15"/>
                    </button>
                    <button (click)="toggleCat(cat)" class="btn btn-ghost btn-sm"
                            [title]="cat.status ? 'Desactivar' : 'Activar'">
                      @if (cat.status) {
                        <app-icon name="toggle-right" [size]="16"/>
                      } @else {
                        <app-icon name="toggle-left" [size]="16"/>
                      }
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Modal -->
    @if (showModal()) {
      <div class="overlay" (click)="closeModal()">
        <div class="modal modal-sm p-6" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold mb-4">{{ editId ? 'Editar' : 'Nueva' }} Categoría</h3>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div class="form-group">
              <label class="form-label">Nombre *</label>
              <input type="text" formControlName="name" class="form-control"/>
              @if (form.controls['name'].invalid && form.controls['name'].touched) {
                <p class="form-error">Nombre requerido.</p>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Descripción</label>
              <textarea formControlName="description" class="form-control" rows="2"></textarea>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) {
                  <app-icon name="loader" [size]="14" class="animate-spin"/>
                } @else {
                  {{ editId ? 'Actualizar' : 'Crear' }}
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
export class CategoryManagementComponent implements OnInit {
  private catSvc = inject(CategoryService);
  private toast  = inject(ToastService);
  private fb     = inject(FormBuilder);

  categories = signal<CategoryResponse[]>([]);
  loading    = signal(true);
  showModal  = signal(false);
  saving     = signal(false);
  editId     = 0;

  form = this.fb.group({
    name:        ['', Validators.required],
    description: ['']
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.catSvc.getAll().subscribe({
      next: c  => { this.categories.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() { this.editId = 0; this.form.reset(); this.showModal.set(true); }
  openEdit(c: CategoryResponse) { this.editId = c.id; this.form.patchValue(c); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const req = this.editId
      ? this.catSvc.update(this.editId, this.form.value as any)
      : this.catSvc.create(this.form.value as any);
    req.subscribe({
      next: () => { this.toast.success(`Categoría ${this.editId ? 'actualizada' : 'creada'}`); this.closeModal(); this.loadAll(); this.saving.set(false); },
      error: err => { this.toast.error(extractApiError(err)); this.saving.set(false); }
    });
  }

  toggleCat(c: CategoryResponse) {
    this.catSvc.toggle(c.id).subscribe({
      next: () => { this.toast.success(`Categoría ${c.status ? 'desactivada' : 'activada'}`); this.loadAll(); },
      error: err => this.toast.error(extractApiError(err))   // RN015: shows API error for active products
    });
  }
}
