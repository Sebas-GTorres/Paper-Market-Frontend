import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartResponse, CartItemResponse } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

const TAX_RATE = 0.19;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyСoPipe, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Carrito de Compras</h1>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else if (!cart() || cart()!.items.length === 0) {
      <app-empty-state icon="shopping-cart" title="Carrito vacío"
                       subtitle="Agrega productos desde el catálogo para comenzar tu pedido."/>
      <div class="text-center mt-4">
        <a routerLink="/client/catalog" class="btn btn-primary btn-lg gap-2">
          <app-icon name="store" [size]="18"/> Ir al catálogo
        </a>
      </div>
    } @else {
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Items -->
        <div class="lg:col-span-2 space-y-3">
          @for (item of cart()!.items; track item.id) {
            <div class="card p-4 flex items-center gap-4">
              <div class="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                @if (item.image) {
                  <img [src]="item.image" [alt]="item.productName" class="w-full h-full object-contain p-1"/>
                } @else {
                  <app-icon name="package" [size]="24" class="text-gray-300"/>
                }
              </div>

              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-text-primary text-sm truncate">{{ item.productName }}</h3>
                <p class="text-sm text-text-secondary">{{ item.unitPrice | currencyCo }} c/u</p>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button (click)="updateQty(item, item.quantity - 1)"
                        [disabled]="item.quantity <= 1 || updatingId() === item.productId"
                        class="btn btn-ghost btn-sm w-8 h-8 p-0">
                  <app-icon name="minus" [size]="14"/>
                </button>
                <span class="w-8 text-center font-bold text-sm">{{ item.quantity }}</span>
                <button (click)="updateQty(item, item.quantity + 1)"
                        [disabled]="updatingId() === item.productId"
                        class="btn btn-ghost btn-sm w-8 h-8 p-0">
                  <app-icon name="plus" [size]="14"/>
                </button>
              </div>

              <div class="text-right shrink-0 min-w-[80px]">
                <p class="font-bold text-primary text-sm">{{ item.subtotal | currencyCo }}</p>
              </div>

              <button (click)="removeItem(item)"
                      [disabled]="removingId() === item.productId"
                      class="btn btn-ghost btn-sm p-1.5 text-danger hover:bg-red-50 shrink-0">
                <app-icon name="trash-2" [size]="15"/>
              </button>
            </div>
          }

          <div class="flex justify-end pt-1">
            <button (click)="clearCart()" class="btn btn-ghost text-danger text-sm gap-1.5">
              <app-icon name="trash" [size]="15"/> Vaciar carrito
            </button>
          </div>
        </div>

        <!-- Summary -->
        <div class="lg:col-span-1">
          <div class="card p-6 sticky top-24">
            <h2 class="text-lg font-bold text-text-primary mb-4">Resumen del pedido</h2>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-text-secondary">Subtotal</span>
                <span class="font-medium">{{ subtotal() | currencyCo }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">IVA (19%)</span>
                <span class="font-medium">{{ tax() | currencyCo }}</span>
              </div>
              <div class="divider"></div>
              <div class="flex justify-between text-base font-bold">
                <span>Total</span>
                <span class="text-primary">{{ total() | currencyCo }}</span>
              </div>
            </div>
            <a routerLink="/client/checkout"
               class="btn btn-primary w-full btn-lg mt-6 gap-2">
              <app-icon name="arrow-right" [size]="16"/> Proceder al pago
            </a>
            <a routerLink="/client/catalog" class="btn btn-ghost w-full mt-2 text-sm">
              Continuar comprando
            </a>
          </div>
        </div>
      </div>
    }
  `
})
export class CartComponent implements OnInit {
  private cartSvc = inject(CartService);
  private toast   = inject(ToastService);
  private auth    = inject(AuthService);

  cart       = signal<CartResponse | null>(null);
  loading    = signal(true);
  updatingId = signal<number | null>(null);
  removingId = signal<number | null>(null);

  subtotal = computed(() => (this.cart()?.items ?? []).reduce((s, i) => s + i.unitPrice * i.quantity, 0));
  tax      = computed(() => this.subtotal() * TAX_RATE);
  total    = computed(() => this.subtotal() + this.tax());

  get customerId(): number {
    const id = this.auth.getCustomerId();
    if (!id) { this.toast.error('No hay cliente vinculado a este usuario.'); return 0; }
    return id;
  }

  ngOnInit() { this.loadCart(); }

  loadCart() {
    this.loading.set(true);
    this.cartSvc.getCart(this.customerId).subscribe({
      next: c  => { this.cart.set(c); this.loading.set(false); },
      error: () => { this.cart.set(null); this.loading.set(false); }
    });
  }

  updateQty(item: CartItemResponse, qty: number) {
    if (qty < 1) return;
    this.updatingId.set(item.productId);
    this.cartSvc.updateItem(this.customerId, item.productId, qty).subscribe({
      next: c  => { this.cart.set(c); this.updatingId.set(null); },
      error: err => { this.toast.error(extractApiError(err)); this.updatingId.set(null); }
    });
  }

  removeItem(item: CartItemResponse) {
    this.removingId.set(item.productId);
    this.cartSvc.removeItem(this.customerId, item.productId).subscribe({
      next: c  => { this.cart.set(c); this.removingId.set(null); },
      error: err => { this.toast.error(extractApiError(err)); this.removingId.set(null); }
    });
  }

  clearCart() {
    this.cartSvc.clearCart(this.customerId).subscribe({
      next: () => this.loadCart(),
      error: err => this.toast.error(extractApiError(err))
    });
  }
}
