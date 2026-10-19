import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { OrderResponse, OrderStatus } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
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
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyСoPipe, DateEsPipe, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Gestion de Pedidos</h1>
    </div>

    <!-- Filtros -->
    <div class="card mb-4 p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <app-icon name="search" [size]="16"/>
        </span>
        <input type="text" [(ngModel)]="searchNum" (input)="searchByNumber()"
               class="search-input" placeholder="Buscar por numero de pedido..."/>
      </div>
      <select [(ngModel)]="filterStatus" (change)="onStatusFilter()" class="form-control w-full sm:w-48">
        <option value="">Todos los estados</option>
        @for (s of statusOptions; track s.value) {
          <option [value]="s.value">{{ s.label }}</option>
        }
      </select>
      <button (click)="clearFilters()" class="btn btn-ghost gap-1.5 whitespace-nowrap">
        <app-icon name="x" [size]="14"/> Limpiar
      </button>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else if (orders().length === 0) {
      <app-empty-state icon="clipboard-list" title="Sin pedidos" subtitle="No se encontraron pedidos."/>
    } @else {
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Numero</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders(); track order.id) {
              <tr>
                <td class="font-mono font-semibold text-sm">{{ order.orderNumber }}</td>
                <td class="text-sm">{{ order.orderDate | dateEs:'short' }}</td>
                <td class="text-sm">{{ order.customer ? (order.customer.names + ' ' + order.customer.surnames) : 'Sin cliente' }}</td>
                <td class="font-semibold text-primary text-sm">{{ order.total | currencyCo }}</td>
                <td><span [ngClass]="statusMap(order.status).css">{{ statusMap(order.status).label }}</span></td>
                <td>
                  <div class="flex items-center gap-2">
                    <a [routerLink]="detailLink(order.id)" class="btn btn-ghost btn-sm gap-1">
                      <app-icon name="eye" [size]="14"/> Ver
                    </a>
                    @if (nextStatuses(order.status).length > 0) {
                      <select class="form-control text-xs py-1 px-2 w-40"
                              (change)="changeStatus(order, $any($event.target).value)">
                        <option value="">Cambiar estado</option>
                        @for (ns of nextStatuses(order.status); track ns) {
                          <option [value]="ns">{{ statusMap(ns).label }}</option>
                        }
                      </select>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class OrderManagementComponent implements OnInit {
  protected orderSvc = inject(OrderService);
  protected toast    = inject(ToastService);

  orders       = signal<OrderResponse[]>([]);
  loading      = signal(true);
  searchNum    = '';
  filterStatus = '';

  statusOptions = Object.entries(STATUS_MAP).map(([value, v]) => ({ value, label: v.label }));

  protected get detailLinkBase() { return '/employee/orders'; }
  detailLink(id: number) { return `${this.detailLinkBase}/${id}`; }

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.orderSvc.getAll().subscribe({
      next: o  => { this.orders.set(o); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onStatusFilter() {
    if (!this.filterStatus) { this.loadAll(); return; }
    this.loading.set(true);
    this.orderSvc.getByStatus(this.filterStatus as OrderStatus).subscribe({
      next: o  => { this.orders.set(o); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  searchByNumber() {
    const num = this.searchNum.trim();
    if (!num) { this.loadAll(); return; }
    this.orderSvc.getByNumber(num).subscribe({
      next: o  => { this.orders.set([o]); this.loading.set(false); },
      error: () => { this.orders.set([]); this.loading.set(false); }
    });
  }

  clearFilters() { this.searchNum = ''; this.filterStatus = ''; this.loadAll(); }
  statusMap(s: string) { return STATUS_MAP[s] ?? { label: s, css: 'badge-gray' }; }
  nextStatuses(s: string): OrderStatus[] { return NEXT_STATUS[s] ?? []; }

  changeStatus(order: OrderResponse, newStatus: string) {
    if (!newStatus) return;
    this.orderSvc.updateStatus(order.id, { status: newStatus as OrderStatus }).subscribe({
      next: updated => {
        this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.toast.success(`Pedido actualizado a ${this.statusMap(newStatus).label}`);
      },
      error: err => this.toast.error(extractApiError(err))
    });
  }
}
