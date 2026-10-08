import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../../core/services/supplier.service';
import { ToastService } from '../../../core/services/toast.service';
import { SupplierResponse } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-supplier-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header flex-row justify-between items-start">
      <div>
        <h1 class="page-title">Proveedores</h1>
        <p class="page-subtitle">Gestión de proveedores</p>
      </div>
      <button (click)="openCreate()" class="btn btn-primary mt-1">+ Nuevo Proveedor</button>
    </div>

    <!-- Filters -->
    <div class="card mb-4 p-4 flex gap-3">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <app-icon name="search" [size]="16"/>
        </span>
        <input type="text" [(ngModel)]="searchQ" (input)="filterLocal()" class="search-input" placeholder="Buscar por nombre o NIT..."/>
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else if (filtered().length === 0) {
      <app-empty-state icon="" title="Sin proveedores" subtitle="Crea el primer proveedor."/>
    } @else {
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>NIT</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (s of filtered(); track s.id) {
              <tr>
                <td class="font-medium">{{ s.name }}</td>
                <td class="font-mono text-sm">{{ s.nit }}</td>
                <td class="text-sm">{{ s.contactPerson || '—' }}</td>
                <td class="text-sm">{{ s.phone || '—' }}</td>
                <td>
                  <span [ngClass]="s.status ? 'badge-success' : 'badge-gray'" class="badge">
                    {{ s.status ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-1">
                    <button (click)="openEdit(s)" class="btn btn-ghost btn-sm">
                      <app-icon name="pencil" [size]="15"/>
                    </button>
                    <button (click)="toggleSupplier(s)" class="btn btn-ghost btn-sm">
                      @if (s.status) {
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
        <div class="modal modal-md p-6" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold mb-4">{{ editId ? 'Editar' : 'Nuevo' }} Proveedor</h3>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group col-span-2">
                <label class="form-label">Nombre *</label>
                <input type="text" formControlName="name" class="form-control"/>
                @if (form.controls['name'].invalid && form.controls['name'].touched) { <p class="form-error">Nombre requerido.</p> }
              </div>
              <div class="form-group">
                <label class="form-label">NIT *</label>
                <input type="text" formControlName="nit" class="form-control"/>
                @if (form.controls['nit'].invalid && form.controls['nit'].touched) { <p class="form-error">NIT requerido.</p> }
              </div>
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="tel" formControlName="phone" class="form-control"/>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" formControlName="email" class="form-control"/>
              </div>
              <div class="form-group">
                <label class="form-label">Persona de contacto</label>
                <input type="text" formControlName="contactPerson" class="form-control"/>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Dirección</label>
                <input type="text" formControlName="address" class="form-control"/>
              </div>
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
export class SupplierManagementComponent implements OnInit {
  private supplierSvc = inject(SupplierService);
  private toast       = inject(ToastService);
  private fb          = inject(FormBuilder);

  allSuppliers = signal<SupplierResponse[]>([]);
  filtered     = signal<SupplierResponse[]>([]);
  loading      = signal(true);
  showModal    = signal(false);
  saving       = signal(false);
  editId       = 0;
  searchQ      = '';

  form = this.fb.group({
    name:          ['', Validators.required],
    nit:           ['', Validators.required],
    phone:         [''],
    email:         [''],
    contactPerson: [''],
    address:       ['']
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.supplierSvc.getAll().subscribe({
      next: s  => { this.allSuppliers.set(s); this.filterLocal(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filterLocal() {
    const q = this.searchQ.toLowerCase();
    this.filtered.set(q ? this.allSuppliers().filter(s => s.name.toLowerCase().includes(q) || s.nit.includes(q)) : this.allSuppliers());
  }

  openCreate() { this.editId = 0; this.form.reset(); this.showModal.set(true); }
  openEdit(s: SupplierResponse) { this.editId = s.id; this.form.patchValue(s); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const req = this.editId
      ? this.supplierSvc.update(this.editId, this.form.value as any)
      : this.supplierSvc.create(this.form.value as any);
    req.subscribe({
      next: () => { this.toast.success(`Proveedor ${this.editId ? 'actualizado' : 'creado'}`); this.closeModal(); this.loadAll(); this.saving.set(false); },
      error: err => { this.toast.error(extractApiError(err)); this.saving.set(false); }
    });
  }

  toggleSupplier(s: SupplierResponse) {
    this.supplierSvc.toggle(s.id).subscribe({
      next: () => { this.toast.success(`Proveedor ${s.status ? 'desactivado' : 'activado'}`); this.loadAll(); },
      error: err => this.toast.error(extractApiError(err))  // RN016: shows API error for purchase history
    });
  }
}
