import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartResponse } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

const TAX_RATE = 0.19;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyСoPipe, IconComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Finalizar Pedido</h1>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else {
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Formulario -->
        <div class="card p-6">
          <h2 class="text-lg font-bold mb-4">Datos de entrega</h2>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">

            <div class="form-group">
              <label class="form-label">Direccion de entrega *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <app-icon name="map-pin" [size]="16"/>
                </span>
                <input type="text" formControlName="deliveryAddress"
                       class="form-control pl-9" placeholder="Calle 1 #2-3, Ciudad"/>
              </div>
              @if (f['deliveryAddress'].invalid && f['deliveryAddress'].touched) {
                <p class="form-error">Direccion requerida (max. 255 caracteres).</p>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Metodo de pago</label>
              <select formControlName="paymentMethod" class="form-control">
                <option value="Contra entrega">Contra entrega</option>
                <option value="Transferencia bancaria">Transferencia bancaria</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Notas adicionales</label>
              <textarea formControlName="notes" class="form-control" rows="3"
                        placeholder="Instrucciones especiales, referencias de ubicacion..."></textarea>
            </div>

            <button type="submit" class="btn btn-primary w-full btn-lg gap-2" [disabled]="submitting()">
              @if (submitting()) {
                <app-icon name="loader" [size]="16" class="animate-spin"/> Procesando...
              } @else {
                <app-icon name="check-circle" [size]="16"/> Confirmar Pedido
              }
            </button>

            <a routerLink="/client/cart" class="btn btn-ghost w-full gap-2">
              <app-icon name="arrow-left" [size]="16"/> Volver al carrito
            </a>
          </form>
        </div>

        <!-- Resumen -->
        <div>
          <div class="card p-6">
            <h2 class="text-lg font-bold mb-4">Resumen del pedido</h2>
            @if (cart()) {
              <div class="space-y-2 mb-4">
                @for (item of cart()!.items; track item.id) {
                  <div class="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                    <span class="text-text-primary">{{ item.productName }} x {{ item.quantity }}</span>
                    <span class="font-medium">{{ item.subtotal | currencyCo }}</span>
                  </div>
                }
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-text-secondary">Subtotal</span>
                  <span>{{ subtotal() | currencyCo }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-text-secondary">IVA (19%)</span>
                  <span>{{ tax() | currencyCo }}</span>
                </div>
                <div class="divider"></div>
                <div class="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span class="text-primary">{{ total() | currencyCo }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class CheckoutComponent implements OnInit {
  private cartSvc  = inject(CartService);
  private orderSvc = inject(OrderService);
  private toast    = inject(ToastService);
  private auth     = inject(AuthService);
  private router   = inject(Router);
  private fb       = inject(FormBuilder);

  cart       = signal<CartResponse | null>(null);
  loading    = signal(true);
  submitting = signal(false);

  subtotal = computed(() => (this.cart()?.items ?? []).reduce((s, i) => s + i.unitPrice * i.quantity, 0));
  tax      = computed(() => this.subtotal() * TAX_RATE);
  total    = computed(() => this.subtotal() + this.tax());

  form = this.fb.group({
    deliveryAddress: ['', [Validators.required, Validators.maxLength(255)]],
    paymentMethod:   ['Contra entrega'],
    notes:           ['', Validators.maxLength(500)]
  });
  get f() { return this.form.controls; }

  get customerId(): number {
    const id = this.auth.getCustomerId();
    if (!id) { this.toast.error('No hay cliente vinculado a este usuario.'); return 0; }
    return id;
  }

  ngOnInit() {
    this.cartSvc.getCart(this.customerId).subscribe({
      next: c  => { this.cart.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const { deliveryAddress, paymentMethod, notes } = this.form.value;
    const combinedNotes = `Pago: ${paymentMethod}${notes ? '. ' + notes : ''}`;
    this.orderSvc.create({
      deliveryAddress: deliveryAddress!,
      notes: combinedNotes,
      customerId: this.customerId
    }).subscribe({
      next: order => {
        this.toast.success(`Pedido #${order.orderNumber} creado exitosamente`);
        this.cartSvc.clearCart(this.customerId).subscribe();
        this.router.navigate(['/client/orders']);
      },
      error: err => { this.toast.error(extractApiError(err)); this.submitting.set(false); }
    });
  }
}
