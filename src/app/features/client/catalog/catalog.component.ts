import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductResponse, CategoryResponse } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyСoPipe, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Catálogo de Productos</h1>
      <p class="page-subtitle">Encuentra todo lo que necesitas</p>
    </div>

    <!-- Filters -->
    <div class="card mb-6 p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <app-icon name="search" [size]="16"/>
          </span>
          <input type="text" [(ngModel)]="searchQuery" (input)="onSearch()"
                 class="search-input" placeholder="Buscar producto..."/>
        </div>
        <select [(ngModel)]="selectedCategory" (change)="onCategoryChange()"
                class="form-control w-full sm:w-48">
          <option value="">Todas las categorías</option>
          @for (cat of categories(); track cat.id) {
            <option [value]="cat.id">{{ cat.name }}</option>
          }
        </select>
        <select [(ngModel)]="selectedBrand" (change)="filterProducts()"
                class="form-control w-full sm:w-40">
          <option value="">Todas las marcas</option>
          @for (brand of brands(); track brand) {
            <option [value]="brand">{{ brand }}</option>
          }
        </select>
        <button (click)="clearFilters()" class="btn btn-ghost whitespace-nowrap gap-1.5">
          <app-icon name="x" [size]="14"/> Limpiar
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    @if (loading()) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        @for (i of [1,2,3,4,5,6,7,8]; track i) {
          <div class="card p-4 space-y-3">
            <div class="skeleton h-48 w-full rounded-lg"></div>
            <div class="skeleton h-5 w-3/4 rounded"></div>
            <div class="skeleton h-4 w-1/2 rounded"></div>
            <div class="skeleton h-9 w-full rounded-lg"></div>
          </div>
        }
      </div>
    } @else if (filtered().length === 0) {
      <app-empty-state icon="search" title="Sin productos"
                       subtitle="No se encontraron productos con los filtros aplicados."/>
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        @for (product of filtered(); track product.id) {
          <div class="card flex flex-col hover:shadow-lg transition-shadow duration-200">

            <!-- Image -->
            <div class="relative h-48 bg-gray-50 overflow-hidden">
              @if (product.image) {
                <img [src]="product.image" [alt]="product.name"
                     class="w-full h-full object-contain p-3"/>
              } @else {
                <div class="w-full h-full flex items-center justify-center text-gray-300">
                  <app-icon name="image" [size]="48"/>
                </div>
              }
              <div class="absolute top-2 right-2">
                <span [ngClass]="stockClass(product)">{{ stockLabel(product) }}</span>
              </div>
            </div>

            <div class="p-4 flex flex-col flex-1 gap-2">
              <div>
                <h3 class="font-semibold text-text-primary text-sm leading-tight line-clamp-2">{{ product.name }}</h3>
                @if (product.brand) {
                  <p class="text-xs text-text-secondary mt-0.5">{{ product.brand }}</p>
                }
              </div>

              <p class="text-xl font-bold text-primary mt-auto">{{ product.salePrice | currencyCo }}</p>

              <div class="flex items-center gap-2 mt-1">
                <a [routerLink]="['/client/product', product.id]"
                   class="btn btn-ghost btn-sm flex-1 text-center">Ver detalle</a>
                <button
                  (click)="addToCart(product)"
                  [disabled]="product.stock === 0 || addingId() === product.id"
                  class="btn btn-primary btn-sm flex-1 gap-1.5">
                  @if (addingId() === product.id) {
                    <app-icon name="loader" [size]="14" class="animate-spin"/>
                  } @else {
                    <app-icon name="shopping-cart" [size]="14"/>
                  }
                  Agregar
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class CatalogComponent implements OnInit {
  private productSvc  = inject(ProductService);
  private categorySvc = inject(CategoryService);
  private cartSvc     = inject(CartService);
  private toast       = inject(ToastService);
  private auth        = inject(AuthService);

  loading         = signal(true);
  allProducts     = signal<ProductResponse[]>([]);
  filtered        = signal<ProductResponse[]>([]);
  categories      = signal<CategoryResponse[]>([]);
  addingId        = signal<number | null>(null);

  searchQuery       = '';
  selectedCategory: string | number = '';
  selectedBrand     = '';

  brands = computed(() => Array.from(new Set(this.allProducts().map(p => p.brand).filter(Boolean))).sort());

  ngOnInit() {
    this.categorySvc.getActive().subscribe({ next: c => this.categories.set(c), error: () => {} });
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.productSvc.getAll().subscribe({
      next: p  => { this.allProducts.set(p.filter(x => x.status)); this.filterProducts(); this.loading.set(false); },
      error: err => { this.toast.error(extractApiError(err)); this.loading.set(false); }
    });
  }

  onSearch() {
    const q = this.searchQuery.trim();
    if (q.length > 2) {
      this.productSvc.searchByName(q).subscribe({
        next: p => { this.allProducts.set(p.filter(x => x.status)); this.filterProducts(); },
        error: () => this.filterProducts()
      });
    } else if (!q) { this.loadProducts(); }
    else { this.filterProducts(); }
  }

  onCategoryChange() {
    if (this.selectedCategory) {
      this.productSvc.getByCategory(+this.selectedCategory).subscribe({
        next: p => { this.allProducts.set(p.filter(x => x.status)); this.filterProducts(); },
        error: err => this.toast.error(extractApiError(err))
      });
    } else { this.loadProducts(); }
  }

  filterProducts() {
    let list = this.allProducts();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    }
    if (this.selectedBrand) list = list.filter(p => p.brand === this.selectedBrand);
    this.filtered.set(list);
  }

  clearFilters() { this.searchQuery = ''; this.selectedCategory = ''; this.selectedBrand = ''; this.loadProducts(); }

  stockClass(p: ProductResponse) {
    if (p.stock === 0) return 'stock-out';
    if (p.stock <= p.minimumStock) return 'stock-low';
    return 'stock-available';
  }
  stockLabel(p: ProductResponse) {
    if (p.stock === 0) return 'Sin stock';
    if (p.stock <= p.minimumStock) return 'Stock bajo';
    return 'Disponible';
  }

  addToCart(product: ProductResponse) {
    const user = this.auth.currentUser();
    if (!user) return;
    const customerId = this.auth.getCustomerId();
    if (!customerId) { this.toast.error('No hay cliente vinculado a este usuario.'); this.addingId.set(null); return; }
    this.addingId.set(product.id);
    this.cartSvc.addItem(customerId, { productId: product.id, quantity: 1 }).subscribe({
      next: () => { this.toast.success(`"${product.name}" agregado al carrito`); this.addingId.set(null); },
      error: err => { this.toast.error(extractApiError(err)); this.addingId.set(null); }
    });
  }
}
