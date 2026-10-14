import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductResponse } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyСoPipe, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Inventario</h1>
      <p class="page-subtitle">Estado actual del stock de productos</p>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="kpi-card">
        <div class="kpi-icon bg-blue-100"><app-icon name="package" [size]="22" class="text-blue-600"/></div>
        <div><p class="kpi-value">{{ total() }}</p><p class="kpi-label">Total productos</p></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon bg-orange-100"><app-icon name="alert-triangle" [size]="22" class="text-warning"/></div>
        <div><p class="kpi-value text-warning">{{ lowStock() }}</p><p class="kpi-label">Stock bajo</p></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon bg-red-100"><app-icon name="package-x" [size]="22" class="text-danger"/></div>
        <div><p class="kpi-value text-danger">{{ outOfStock() }}</p><p class="kpi-label">Sin stock</p></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon bg-green-100"><app-icon name="package-check" [size]="22" class="text-success"/></div>
        <div><p class="kpi-value text-success">{{ inStock() }}</p><p class="kpi-label">Disponibles</p></div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4 p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><app-icon name="search" [size]="16"/></span>
        <input type="text" [(ngModel)]="searchQ" (input)="filter()" class="search-input" placeholder="Buscar producto..."/>
      </div>
      <select [(ngModel)]="stockFilter" (change)="filter()" class="form-control w-full sm:w-44">
        <option value="">Todos</option>
        <option value="low">Stock bajo</option>
        <option value="out">Sin stock</option>
        <option value="ok">Disponible</option>
      </select>
      <button (click)="loadLowStock()" class="btn btn-warning btn-sm gap-1.5 whitespace-nowrap">
        <app-icon name="alert-triangle" [size]="14"/> Solo stock bajo
      </button>
      <button (click)="loadAll()" class="btn btn-ghost btn-sm">Ver todos</button>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><app-icon name="loader" [size]="32" class="animate-spin text-primary"/></div>
    } @else if (filtered().length === 0) {
      <app-empty-state icon="archive" title="Sin productos" subtitle="No se encontraron productos."/>
    } @else {
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Marca</th>
              <th class="text-right">Stock actual</th>
              <th class="text-right">Stock mínimo</th>
              <th class="text-right">Precio venta</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtered(); track p.id) {
              <tr [ngClass]="p.stock === 0 ? 'bg-red-50' : p.stock <= p.minimumStock ? 'bg-orange-50' : ''">
                <td>
                  <div class="flex items-center gap-2">
                    @if (p.image) {
                      <img [src]="p.image" [alt]="p.name" class="w-8 h-8 object-contain rounded-lg"/>
                    } @else {
                      <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <app-icon name="package" [size]="14" class="text-gray-400"/>
                      </div>
                    }
                    <span class="font-medium text-sm">{{ p.name }}</span>
                  </div>
                </td>
                <td class="text-sm text-text-secondary">{{ p.brand || '—' }}</td>
                <td class="text-right font-bold text-sm"
                    [ngClass]="p.stock === 0 ? 'text-danger' : p.stock <= p.minimumStock ? 'text-warning' : 'text-success'">
                  {{ p.stock }}
                </td>
                <td class="text-right text-sm text-text-secondary">{{ p.minimumStock }}</td>
                <td class="text-right font-medium text-sm">{{ p.salePrice | currencyCo }}</td>
                <td>
                  @if (p.stock === 0) { <span class="stock-out">Sin stock</span> }
                  @else if (p.stock <= p.minimumStock) { <span class="stock-low">Stock bajo</span> }
                  @else { <span class="stock-available">Disponible</span> }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class InventoryComponent implements OnInit {
  private productSvc = inject(ProductService);
  private toast      = inject(ToastService);

  allProducts = signal<ProductResponse[]>([]);
  filtered    = signal<ProductResponse[]>([]);
  loading     = signal(true);
  searchQ     = '';
  stockFilter = '';

  total      = () => this.allProducts().length;
  lowStock   = () => this.allProducts().filter(p => p.stock > 0 && p.stock <= p.minimumStock).length;
  outOfStock = () => this.allProducts().filter(p => p.stock === 0).length;
  inStock    = () => this.allProducts().filter(p => p.stock > p.minimumStock).length;

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.productSvc.getAll().subscribe({
      next: p  => { this.allProducts.set(p); this.filter(); this.loading.set(false); },
      error: err => { this.toast.error(extractApiError(err)); this.loading.set(false); }
    });
  }

  loadLowStock() {
    this.loading.set(true);
    this.productSvc.getLowStock().subscribe({
      next: p  => { this.allProducts.set(p); this.filter(); this.loading.set(false); },
      error: err => { this.toast.error(extractApiError(err)); this.loading.set(false); }
    });
  }

  filter() {
    let list = this.allProducts();
    if (this.searchQ.trim()) {
      const q = this.searchQ.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    }
    if (this.stockFilter === 'low') list = list.filter(p => p.stock > 0 && p.stock <= p.minimumStock);
    if (this.stockFilter === 'out') list = list.filter(p => p.stock === 0);
    if (this.stockFilter === 'ok')  list = list.filter(p => p.stock > p.minimumStock);
    this.filtered.set(list);
  }
}
