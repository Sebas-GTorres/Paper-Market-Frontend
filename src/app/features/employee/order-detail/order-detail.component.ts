import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { OrderResponse, OrderStatus } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';
import { BreadcrumbComponent } from '../../../shared/components/breadcrumb/breadcrumb.component';
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

const NEXT_STATUS: Record<string, OrderStatus[]> = {
  PENDING:   ['PAID', 'CANCELED'],
  PAID:      ['PREPARING', 'CANCELED'],
  PREPARING: ['SHIPPED'],
  SHIPPED:   ['DELIVERED'],
};

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, CurrencyСoPipe, DateEsPipe, BreadcrumbComponent, IconComponent],
  template: `
    <app-breadcrumb [items]="breadcrumb"/>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else if (order()) {
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Principal -->
        <div class="lg:col-span-2 space-y-4">
          <div class="card p-6">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h1 class="text-xl font-bold text-text-primary font-mono">{{ order()!.orderNumber }}</h1>
                <p class="text-sm text-text-secondary">{{ order()!.createdAt | dateEs }}</p>
              </div>
              <span [ngClass]="statusMap(order()!.status).css" class="text-sm px-3 py-1">
                {{ statusMap(order()!.status).label }}
              </span>
            </div>

            <!-- Cambiar estado -->
            @if (nextStatuses(order()!.status).length > 0) {
              <div class="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-xl">
                <span class="text-sm text-text-secondary self-center">Cambiar estado:</span>
                @for (ns of nextStatuses(order()!.status); track ns) {
                  <button (click)="changeStatus(ns)" class="btn btn-sm gap-1.5"
                          [ngClass]="ns === 'CANCELED' ? 'btn-danger' : 'btn-primary'">
                    <app-icon name="arrow-right" [size]="13"/>
                    {{ statusMap(ns).label }}
                  </button>
                }
              </div>
            }

            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="text-right">Cant.</th>
                    <th class="text-right">Precio unit.</th>
                    <th class="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (d of order()!.details; track d.id) {
                    <tr>
                      <td>{{ d.productName }}</td>
                      <td class="text-right">{{ d.quantity }}</td>
                      <td class="text-right">{{ d.unitPrice | currencyCo }}</td>
                      <td class="text-right font-medium">{{ d.subtotal | currencyCo }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Lateral -->
        <div class="space-y-4">
          <div class="card p-6 space-y-3">
            <h2 class="font-bold text-text-primary">Resumen financiero</h2>
            <div class="flex justify-between text-sm">
              <span class="text-text-secondary">Subtotal</span>
              <span>{{ order()!.subtotal | currencyCo }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-text-secondary">IVA</span>
              <span>{{ order()!.tax | currencyCo }}</span>
            </div>
            <div class="divider"></div>
            <div class="flex justify-between font-bold">
              <span>Total</span>
              <span class="text-primary">{{ order()!.total | currencyCo }}</span>
            </div>
          </div>

          <div class="card p-6 space-y-3 text-sm">
            <h2 class="font-bold text-text-primary">Datos de entrega</h2>
            <div class="flex items-start gap-2 text-text-secondary">
              <app-icon name="map-pin" [size]="14" class="mt-0.5 shrink-0"/>
              <span>{{ order()!.deliveryAddress }}</span>
            </div>
            @if (order()!.notes) {
              <div class="flex items-start gap-2 text-text-secondary">
                <app-icon name="file-text" [size]="14" class="mt-0.5 shrink-0"/>
                <span>{{ order()!.notes }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class OrderDetailComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private orderSvc = inject(OrderService);
  private toast    = inject(ToastService);

  order   = signal<OrderResponse | null>(null);
  loading = signal(true);

  get breadcrumb() {
    const base = this.route.snapshot.data['base'] ?? '/employee/orders';
    return [{ label: 'Pedidos', link: base }, { label: this.order()?.orderNumber ?? 'Detalle' }];
  }

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.orderSvc.getById(id).subscribe({
      next: o  => { this.order.set(o); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  statusMap(s: string) { return STATUS_MAP[s] ?? { label: s, css: 'badge-gray' }; }
  nextStatuses(s: string): OrderStatus[] { return NEXT_STATUS[s] ?? []; }

  changeStatus(newStatus: OrderStatus) {
    const o = this.order();
    if (!o) return;
    this.orderSvc.updateStatus(o.id, { status: newStatus }).subscribe({
      next: updated => { this.order.set(updated); this.toast.success('Estado actualizado'); },
      error: err    => this.toast.error(extractApiError(err))
    });
  }
}
