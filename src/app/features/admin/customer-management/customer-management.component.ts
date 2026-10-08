import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { ToastService } from '../../../core/services/toast.service';
import { CustomerResponse, CustomerStatus } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header flex-row justify-between items-start">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">Gestión de clientes registrados</p>
      </div>
      <button (click)="openCreate()" class="btn btn-primary mt-1">+ Nuevo Cliente</button>
    </div>

    <!-- Filters -->
    <div class="card mb-4 p-4 flex gap-3">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
        <input type="text" [(ngModel)]="searchQ" (input)="filterLocal()"
               class="search-input" placeholder="Buscar por nombre o documento..."/>
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="animate-spin inline-block text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg></span></div>
    } @else if (filtered().length === 0) {
      <app-empty-state icon="👤" title="Sin clientes" subtitle="Crea el primer cliente."/>
    } @else {
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr>
                <td>
                  <p class="font-medium text-sm">{{ c.names }} {{ c.surnames }}</p>
                </td>
                <td class="font-mono text-sm">{{ c.document }}</td>
                <td class="text-sm">{{ c.phone || '—' }}</td>
                <td class="text-sm text-text-secondary">{{ c.email || '—' }}</td>
                <td>
                  <span [ngClass]="c.status === 'ACTIVE' ? 'badge-success' : 'badge-gray'" class="badge">
                    {{ c.status === 'ACTIVE' ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-1">
                    <button (click)="openEdit(c)" class="btn btn-ghost btn-sm">
                      <app-icon name="pencil" [size]="15"/>
                    </button>
                    <button (click)="toggleCustomer(c)" class="btn btn-ghost btn-sm">
                      <app-icon [name]="c.status === 'ACTIVE' ? 'toggle-right' : 'toggle-left'" [size]="18"
                                [ngClass]="c.status === 'ACTIVE' ? 'text-success' : 'text-gray-400'"/>
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
          <h3 class="text-lg font-bold mb-4">{{ editId ? 'Editar' : 'Nuevo' }} Cliente</h3>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Nombres *</label>
                <input type="text" formControlName="names" class="form-control"/>
                @if (form.controls['names'].invalid && form.controls['names'].touched) { <p class="form-error">Requerido.</p> }
              </div>
              <div class="form-group">
                <label class="form-label">Apellidos *</label>
                <input type="text" formControlName="surnames" class="form-control"/>
                @if (form.controls['surnames'].invalid && form.controls['surnames'].touched) { <p class="form-error">Requerido.</p> }
              </div>
              <div class="form-group">
                <label class="form-label">Documento *</label>
                <input type="text" formControlName="document" class="form-control"/>
                @if (form.controls['document'].invalid && form.controls['document'].touched) { <p class="form-error">Requerido.</p> }
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
                <label class="form-label">Dirección</label>
                <input type="text" formControlName="address" class="form-control"/>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn btn-primary gap-2" [disabled]="saving()">
                @if (saving()) {
                  <app-icon name="loader" [size]="14" class="animate-spin"/> Guardando...
                } @else {
                  <app-icon name="save" [size]="14"/> {{ editId ? 'Actualizar' : 'Crear' }}
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
export class CustomerManagementComponent implements OnInit {
  private customerSvc = inject(CustomerService);
  private toast       = inject(ToastService);
  private fb          = inject(FormBuilder);

  allCustomers = signal<CustomerResponse[]>([]);
  filtered     = signal<CustomerResponse[]>([]);
  loading      = signal(true);
  showModal    = signal(false);
  saving       = signal(false);
  editId       = 0;
  searchQ      = '';

  form = this.fb.group({
    names:    ['', Validators.required],
    surnames: ['', Validators.required],
    document: ['', Validators.required],
    phone:    [''],
    email:    [''],
    address:  ['']
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.customerSvc.getAll().subscribe({
      next: c  => { this.allCustomers.set(c); this.filterLocal(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filterLocal() {
    const q = this.searchQ.toLowerCase();
    this.filtered.set(q
      ? this.allCustomers().filter(c => `${c.names} ${c.surnames} ${c.document}`.toLowerCase().includes(q))
      : this.allCustomers()
    );
  }

  openCreate() { this.editId = 0; this.form.reset(); this.showModal.set(true); }
  openEdit(c: CustomerResponse) { this.editId = c.id; this.form.patchValue(c); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const req = this.editId
      ? this.customerSvc.update(this.editId, this.form.value as any)
      : this.customerSvc.create(this.form.value as any);
    req.subscribe({
      next: () => { this.toast.success(`Cliente ${this.editId ? 'actualizado' : 'creado'}`); this.closeModal(); this.loadAll(); this.saving.set(false); },
      error: err => { this.toast.error(extractApiError(err)); this.saving.set(false); }
    });
  }

  toggleCustomer(c: CustomerResponse) {
    const newStatus: CustomerStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.customerSvc.changeStatus(c.id, newStatus).subscribe({
      next: () => { this.toast.success('Estado de cliente actualizado'); this.loadAll(); },
      error: err => this.toast.error(extractApiError(err))
    });
  }
}
