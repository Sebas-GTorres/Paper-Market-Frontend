import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductResponse, ProductRequest, CategoryResponse, SupplierResponse } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyСoPipe, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header flex-row justify-between items-start">
      <div>
        <h1 class="page-title">Productos</h1>
        <p class="page-subtitle">Gestion del catalogo de productos</p>
      </div>
      <button (click)="openCreate()" class="btn btn-primary mt-1 gap-2">
        <app-icon name="plus" [size]="16"/> Nuevo Producto
      </button>
    </div>

    <!-- Filters -->
    <div class="card mb-4 p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
        <input type="text" [(ngModel)]="searchQ" (input)="filterLocal()"
               class="search-input" placeholder="Buscar por nombre o marca..."/>
      </div>
      <select [(ngModel)]="statusFilter" (change)="filterLocal()" class="form-control w-full sm:w-36">
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else if (filtered().length === 0) {
      <app-empty-state icon="package" title="Sin productos" subtitle="No se encontraron productos."/>
    } @else {
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio compra</th>
              <th>Precio venta</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtered(); track p.id) {
              <tr>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      @if (p.image) { <img [src]="p.image" [alt]="p.name" class="w-full h-full object-contain p-0.5"/> }
                      @else { <app-icon name="package" [size]="16" class="text-gray-400"/> }
                    </div>
                    <div class="min-w-0">
                      <p class="font-medium text-sm truncate">{{ p.name }}</p>
                      @if (p.brand) { <p class="text-xs text-text-secondary">{{ p.brand }}</p> }
                    </div>
                  </div>
                </td>
                <td class="text-sm">{{ p.purchasePrice | currencyCo }}</td>
                <td class="text-sm font-semibold text-primary">{{ p.salePrice | currencyCo }}</td>
                <td>
                  <span [ngClass]="p.stock === 0 ? 'stock-out' : p.stock <= p.minimumStock ? 'stock-low' : 'stock-available'">
                    {{ p.stock }}
                  </span>
                </td>
                <td>
                  <span [ngClass]="p.status ? 'badge-success' : 'badge-gray'" class="badge">
                    {{ p.status ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-1">
                    <button (click)="openEdit(p)" class="btn btn-ghost btn-sm">
                      <app-icon name="pencil" [size]="15"/>
                    </button>
                    <button (click)="toggleProduct(p)" class="btn btn-ghost btn-sm"
                            [title]="p.status ? 'Desactivar' : 'Activar'">
                      <app-icon [name]="p.status ? 'toggle-right' : 'toggle-left'" [size]="18"
                                [ngClass]="p.status ? 'text-success' : 'text-gray-400'"/>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Create/Edit Modal -->
    @if (showModal()) {
      <div class="overlay" (click)="closeModal()">
        <div class="modal modal-xl p-6" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold mb-4">{{ editId ? 'Editar' : 'Nuevo' }} Producto</h3>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group sm:col-span-2">
                <label class="form-label">Nombre *</label>
                <input type="text" formControlName="name" class="form-control" maxlength="150"/>
                @if (f['name'].invalid && f['name'].touched) { <p class="form-error">Nombre requerido (máx. 150).</p> }
              </div>
              <div class="form-group sm:col-span-2">
                <label class="form-label">Descripción</label>
                <textarea formControlName="description" class="form-control" rows="2" maxlength="1000"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Código de barras</label>
                <input type="text" formControlName="barcode" class="form-control" maxlength="50"/>
              </div>
              <div class="form-group">
                <label class="form-label">Marca</label>
                <input type="text" formControlName="brand" class="form-control" maxlength="100"/>
              </div>
              <div class="form-group">
                <label class="form-label">Precio de compra *</label>
                <input type="number" formControlName="purchasePrice" class="form-control" [min]="0"/>
                @if (f['purchasePrice'].invalid && f['purchasePrice'].touched) { <p class="form-error">Precio ≥ 0 requerido.</p> }
              </div>
              <div class="form-group">
                <label class="form-label">Precio de venta *</label>
                <input type="number" formControlName="salePrice" class="form-control" [min]="0"/>
                @if (f['salePrice'].invalid && f['salePrice'].touched) { <p class="form-error">Precio ≥ 0 requerido.</p> }
              </div>
              <div class="form-group">
                <label class="form-label">Stock *</label>
                <input type="number" formControlName="stock" class="form-control" [min]="0"/>
                @if (f['stock'].invalid && f['stock'].touched) { <p class="form-error">Stock ≥ 0 requerido.</p> }
              </div>
              <div class="form-group">
                <label class="form-label">Stock mínimo *</label>
                <input type="number" formControlName="minimumStock" class="form-control" [min]="0"/>
                @if (f['minimumStock'].invalid && f['minimumStock'].touched) { <p class="form-error">Stock mínimo ≥ 0 requerido.</p> }
              </div>
              <div class="form-group">
                <label class="form-label">Categoría *</label>
                <select formControlName="categoryId" class="form-control">
                  <option value="">Seleccionar...</option>
                  @for (c of categories(); track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
                </select>
                @if (f['categoryId'].invalid && f['categoryId'].touched) { <p class="form-error">Categoría requerida.</p> }
              </div>
              <div class="form-group">
                <label class="form-label">Proveedor *</label>
                <select formControlName="supplierId" class="form-control">
                  <option value="">Seleccionar...</option>
                  @for (s of suppliers(); track s.id) {
                    <option [value]="s.id">{{ s.name }}</option>
                  }
                </select>
                @if (f['supplierId'].invalid && f['supplierId'].touched) { <p class="form-error">Proveedor requerido.</p> }
              </div>
              <div class="form-group sm:col-span-2">
                <label class="form-label">URL de imagen</label>
                <input type="url" formControlName="image" class="form-control" maxlength="255"/>
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
export class ProductManagementComponent implements OnInit {
  private productSvc  = inject(ProductService);
  private categorySvc = inject(CategoryService);
  private supplierSvc = inject(SupplierService);
  private toast       = inject(ToastService);
  private fb          = inject(FormBuilder);

  allProducts = signal<ProductResponse[]>([]);
  filtered    = signal<ProductResponse[]>([]);
  categories  = signal<CategoryResponse[]>([]);
  suppliers   = signal<SupplierResponse[]>([]);
  loading     = signal(true);
  showModal   = signal(false);
  saving      = signal(false);
  editId      = 0;

  searchQ     = '';
  statusFilter= '';

  form = this.fb.group({
    name:          ['', [Validators.required, Validators.maxLength(150)]],
    description:   ['', Validators.maxLength(1000)],
    barcode:       ['', Validators.maxLength(50)],
    brand:         ['', Validators.maxLength(100)],
    purchasePrice: [0, [Validators.required, Validators.min(0)]],
    salePrice:     [0, [Validators.required, Validators.min(0)]],
    stock:         [0, [Validators.required, Validators.min(0)]],
    minimumStock:  [0, [Validators.required, Validators.min(0)]],
    image:         ['', Validators.maxLength(255)],
    categoryId:    ['', Validators.required],
    supplierId:    ['', Validators.required],
  });
  get f() { return this.form.controls; }

  ngOnInit() {
    forkJoin({ categories: this.categorySvc.getAll(), suppliers: this.supplierSvc.getAll() }).subscribe({
      next: ({ categories, suppliers }) => { this.categories.set(categories); this.suppliers.set(suppliers); }
    });
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    this.productSvc.getAll().subscribe({
      next: p  => { this.allProducts.set(p); this.filterLocal(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filterLocal() {
    let list = this.allProducts();
    if (this.searchQ.trim()) {
      const q = this.searchQ.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    }
    if (this.statusFilter !== '') list = list.filter(p => String(p.status) === this.statusFilter);
    this.filtered.set(list);
  }

  openCreate() { this.editId = 0; this.form.reset({ purchasePrice: 0, salePrice: 0, stock: 0, minimumStock: 0 }); this.showModal.set(true); }

  openEdit(p: ProductResponse) {
    this.editId = p.id;
    this.form.patchValue({ ...p, categoryId: p.category?.id as any ?? '', supplierId: p.supplier?.id as any ?? '' });
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const body: ProductRequest = {
      ...this.form.value,
      categoryId: +this.form.value.categoryId!,
      supplierId: +this.form.value.supplierId!,
    } as any;
    const req = this.editId
      ? this.productSvc.update(this.editId, body)
      : this.productSvc.create(body);
    req.subscribe({
      next: () => {
        this.toast.success(`Producto ${this.editId ? 'actualizado' : 'creado'} exitosamente`);
        this.closeModal(); this.loadAll(); this.saving.set(false);
      },
      error: err => { this.toast.error(extractApiError(err)); this.saving.set(false); }
    });
  }

  toggleProduct(p: ProductResponse) {
    this.productSvc.toggle(p.id).subscribe({
      next: () => { this.toast.success(`Producto ${p.status ? 'desactivado' : 'activado'}`); this.loadAll(); },
      error: err => this.toast.error(extractApiError(err))
    });
  }
}
