import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductResponse } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { BreadcrumbComponent } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyСoPipe, BreadcrumbComponent, IconComponent],
  template: `
    <app-breadcrumb [items]="[{label:'Catalogo', link:'/client/catalog'}, {label: product()?.name ?? 'Producto'}]"/>

    @if (loading()) {
      <div class="flex justify-center py-24">
        <app-icon name="loader" [size]="36" class="animate-spin text-primary"/>
      </div>
    } @else if (product()) {
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

        <!-- Imagen -->
        <div class="card p-6 flex items-center justify-center h-80 bg-gray-50">
          @if (product()!.image) {
            <img [src]="product()!.image" [alt]="product()!.name" class="h-full object-contain"/>
          } @else {
            <app-icon name="package" [size]="80" class="text-gray-200"/>
          }
        </div>

        <!-- Info -->
        <div class="space-y-5">
          <div>
            @if (product()!.brand) {
              <span class="badge badge-primary mb-2">{{ product()!.brand }}</span>
            }
            <h1 class="text-2xl font-bold text-text-primary">{{ product()!.name }}</h1>
            @if (product()!.description) {
              <p class="text-text-secondary mt-2 text-sm leading-relaxed">{{ product()!.description }}</p>
            }
          </div>

          <div class="flex items-center gap-3">
            <span class="text-3xl font-bold text-primary">{{ product()!.salePrice | currencyCo }}</span>
            <span [ngClass]="stockClass()">{{ stockLabel() }}</span>
          </div>

          @if (product()!.barcode) {
            <div class="flex items-center gap-2 text-sm text-text-secondary">
              <app-icon name="barcode" [size]="16"/>
              <span class="font-mono">{{ product()!.barcode }}</span>
            </div>
          }

          <!-- Cantidad -->
          <div class="flex items-center gap-3">
            <label class="form-label shrink-0">Cantidad:</label>
            <div class="flex items-center gap-1">
              <button (click)="decQty()" class="btn btn-ghost btn-sm w-9 h-9 p-0">
                <app-icon name="minus" [size]="14"/>
              </button>
              <input type="number" [(ngModel)]="qty" [min]="1" [max]="product()!.stock"
                     class="form-control w-16 text-center font-semibold"/>
              <button (click)="incQty()" class="btn btn-ghost btn-sm w-9 h-9 p-0">
                <app-icon name="plus" [size]="14"/>
              </button>
            </div>
            <span class="text-sm text-text-secondary">{{ product()!.stock }} disponibles</span>
          </div>

          <div class="flex gap-3 flex-wrap pt-1">
            <button (click)="addToCart()" [disabled]="product()!.stock === 0 || adding()"
                    class="btn btn-primary btn-lg flex-1 gap-2">
              @if (adding()) {
                <app-icon name="loader" [size]="16" class="animate-spin"/> Agregando...
              } @else {
                <app-icon name="shopping-cart" [size]="16"/> Agregar al carrito
              }
            </button>
            <a routerLink="/client/cart" class="btn btn-outline btn-lg gap-2">
              <app-icon name="arrow-right" [size]="16"/> Ver carrito
            </a>
          </div>
        </div>
      </div>
    } @else {
      <div class="text-center py-16">
        <app-icon name="package-x" [size]="48" class="text-gray-300 mx-auto mb-4"/>
        <p class="text-text-secondary">Producto no encontrado.</p>
        <a routerLink="/client/catalog" class="btn btn-primary mt-4 gap-2">
          <app-icon name="arrow-left" [size]="16"/> Volver al catalogo
        </a>
      </div>
    }
  `
})
export class ProductDetailComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  private productSvc = inject(ProductService);
  private cartSvc    = inject(CartService);
  private toast      = inject(ToastService);
  private auth       = inject(AuthService);

  product = signal<ProductResponse | null>(null);
  loading = signal(true);
  adding  = signal(false);
  qty     = 1;

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.productSvc.getById(id).subscribe({
      next: p  => { this.product.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  stockClass() {
    const p = this.product()!;
    if (p.stock === 0) return 'stock-out';
    if (p.stock <= p.minimumStock) return 'stock-low';
    return 'stock-available';
  }
  stockLabel() {
    const p = this.product()!;
    if (p.stock === 0) return 'Sin stock';
    if (p.stock <= p.minimumStock) return 'Stock bajo';
    return 'Disponible';
  }
  decQty() { if (this.qty > 1) this.qty--; }
  incQty() { if (this.qty < (this.product()?.stock ?? 1)) this.qty++; }

  addToCart() {
    const customerId = this.auth.getCustomerId();
    if (!customerId || !this.product()) return;
    this.adding.set(true);
    this.cartSvc.addItem(customerId, { productId: this.product()!.id, quantity: this.qty }).subscribe({
      next: () => { this.toast.success('Producto agregado al carrito'); this.adding.set(false); },
      error: err => { this.toast.error(extractApiError(err)); this.adding.set(false); }
    });
  }
}
