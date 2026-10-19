import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderResponse } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

const STATUS_MAP: Record<string, { label: string; css: string }> = {
  PENDING:   { label: 'Pendiente',  css: 'status-pending' },
  PAID:      { label: 'Pagado',     css: 'status-paid' },
  PREPARING: { label: 'Preparando', css: 'status-preparing' },
  SHIPPED:   { label: 'Enviado',    css: 'status-shipped' },
  DELIVERED: { label: 'Entregado',  css: 'status-delivered' },
  CANCELED:  { label: 'Cancelado',  css: 'status-canceled' },
};

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, CurrencyСoPipe, DateEsPipe, EmptyStateComponent, ConfirmModalComponent, IconComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Mis Pedidos</h1>
      <p class="page-subtitle">Historial y estado de tus pedidos</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else if (orders().length === 0) {
      <app-empty-state icon="clipboard-list" title="Sin pedidos"
                       subtitle="Aun no has realizado ningun pedido."/>
    } @else {
      <div class="space-y-4">
        @for (order of orders(); track order.id) {
          <div class="card">
            <!-- Header -->
            <div class="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-3">
                <app-icon name="clipboard-list" [size]="18" class="text-primary shrink-0"/>
                <div>
                  <span class="font-mono font-semibold text-text-primary">{{ order.orderNumber }}</span>
                  <span class="text-text-secondary text-sm ml-3">{{ (order.orderDate || order.createdAt) | dateEs }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span [ngClass]="statusMap(order.status).css">{{ statusMap(order.status).label }}</span>
                @if (canCancel(order.status)) {
                  <button (click)="openCancel(order)" class="btn btn-danger btn-sm gap-1.5">
                    <app-icon name="x-circle" [size]="14"/> Cancelar
                  </button>
                }
              </div>
            </div>

            <!-- Productos -->
            <div class="card-body">
              <div class="table-wrapper">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th class="text-right">Cantidad</th>
                      <th class="text-right">Precio unit.</th>
                      <th class="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (d of order.details; track d.id) {
                      <tr>
                        <td>{{ d.product?.name ?? d.productName }}</td>
                        <td class="text-right">{{ d.quantity }}</td>
                        <td class="text-right">{{ d.unitPrice | currencyCo }}</td>
                        <td class="text-right font-medium">{{ d.subtotal | currencyCo }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Totales -->
              <div class="flex justify-end mt-4">
                <div class="text-sm space-y-1 min-w-[200px]">
                  <div class="flex justify-between gap-8">
                    <span class="text-text-secondary">Subtotal</span>
                    <span>{{ order.subtotal | currencyCo }}</span>
                  </div>
                  <div class="flex justify-between gap-8">
                    <span class="text-text-secondary">IVA</span>
                    <span>{{ order.tax | currencyCo }}</span>
                  </div>
                  <div class="flex justify-between gap-8 font-bold text-base border-t border-gray-100 pt-1">
                    <span>Total</span>
                    <span class="text-primary">{{ order.total | currencyCo }}</span>
                  </div>
                </div>
              </div>

              <!-- Detalles extras -->
              @if (order.deliveryAddress) {
                <div class="flex items-start gap-2 mt-3 text-sm text-text-secondary">
                  <app-icon name="map-pin" [size]="14" class="mt-0.5 shrink-0"/>
                  <span>{{ order.deliveryAddress }}</span>
                </div>
              }
              @if (order.notes) {
                <div class="flex items-start gap-2 mt-1 text-sm text-text-secondary">
                  <app-icon name="file-text" [size]="14" class="mt-0.5 shrink-0"/>
                  <span>{{ order.notes }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }

    <app-confirm-modal
      [visible]="showCancel()"
      title="Cancelar pedido"
      message="Esta accion no se puede deshacer. El pedido quedara cancelado definitivamente."
      confirmLabel="Si, cancelar"
      [danger]="true"
      (confirm)="confirmCancel()"
      (cancel)="showCancel.set(false)"/>
  `
})
export class MyOrdersComponent implements OnInit {
  private orderSvc = inject(OrderService);
  private toast    = inject(ToastService);
  private auth     = inject(AuthService);

  orders     = signal<OrderResponse[]>([]);
  loading    = signal(true);
  showCancel = signal(false);
  targetOrder: OrderResponse | null = null;

  get customerId(): number {
    const id = this.auth.getCustomerId();
    return id ?? 0;
  }

  ngOnInit() {
    this.orderSvc.getByCustomer(this.customerId).subscribe({
      next: o  => { this.orders.set(o); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  statusMap(status: string) { return STATUS_MAP[status] ?? { label: status, css: 'badge-gray' }; }
  canCancel(status: string) { return status === 'PENDING' || status === 'PAID'; }

  openCancel(order: OrderResponse) { this.targetOrder = order; this.showCancel.set(true); }

  confirmCancel() {
    if (!this.targetOrder) return;
    this.orderSvc.cancel(this.targetOrder.id, this.customerId).subscribe({
      next: () => { this.toast.success('Pedido cancelado'); this.showCancel.set(false); this.ngOnInit(); },
      error: err => { this.toast.error(extractApiError(err)); this.showCancel.set(false); }
    });
  }
}
