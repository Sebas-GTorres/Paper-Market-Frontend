import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleService } from '../../../core/services/sale.service';
import { ToastService } from '../../../core/services/toast.service';
import { SaleResponse } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-sale-management',
  standalone: true,
  imports: [CommonModule, CurrencyСoPipe, DateEsPipe, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Historial de Ventas</h1>
      <p class="page-subtitle">Registro de todas las ventas realizadas</p>
    </div>

    <!-- KPI -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div class="kpi-card">
        <div class="kpi-icon bg-green-100">
          <app-icon name="dollar-sign" [size]="20"/>
        </div>
        <div>
          <p class="kpi-value text-success">{{ totalSales() | currencyCo }}</p>
          <p class="kpi-label">Total vendido</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon bg-blue-100">
          <app-icon name="clipboard-list" [size]="20"/>
        </div>
        <div>
          <p class="kpi-value">{{ sales().length }}</p>
          <p class="kpi-label">Ventas registradas</p>
        </div>
      </div>
      <div class="kpi-card col-span-2 lg:col-span-1">
        <div class="kpi-icon bg-purple-100">
          <app-icon name="package" [size]="20"/>
        </div>
        <div>
          <p class="kpi-value">{{ totalItems() }}</p>
          <p class="kpi-label">Productos vendidos</p>
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else if (sales().length === 0) {
      <app-empty-state icon="" title="Sin ventas" subtitle="No hay ventas registradas."/>
    } @else {
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>N° Venta</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Empleado</th>
              <th class="text-right">Descuento</th>
              <th class="text-right">Total</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            @for (sale of sales(); track sale.id) {
              <tr>
                <td class="font-mono font-semibold">{{ sale.saleNumber }}</td>
                <td class="text-sm">{{ sale.createdAt | dateEs:'short' }}</td>
                <td class="text-sm">{{ sale.customerId ? 'Cliente #' + sale.customerId : 'Anónimo' }}</td>
                <td class="text-sm">Usuario #{{ sale.userId }}</td>
                <td class="text-right text-sm">
                  @if (sale.discountPercent > 0) {
                    <span class="badge-warning badge">{{ sale.discountPercent }}%</span>
                  } @else { — }
                </td>
                <td class="text-right font-bold text-primary">{{ sale.total | currencyCo }}</td>
                <td>
                  <button (click)="selectedSale.set(selectedSale()?.id === sale.id ? null : sale)"
                          class="btn btn-ghost btn-sm text-xs">
                    {{ selectedSale()?.id === sale.id ? 'Cerrar' : 'Ver' }}
                  </button>
                </td>
              </tr>
              @if (selectedSale()?.id === sale.id) {
                <tr class="bg-blue-50">
                  <td colspan="7" class="px-4 py-3">
                    <div class="space-y-1">
                      @for (d of sale.details; track d.id) {
                        <div class="flex justify-between text-sm">
                          <span>{{ d.productName }} × {{ d.quantity }}</span>
                          <span class="font-medium">{{ d.subtotal | currencyCo }}</span>
                        </div>
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class SaleManagementComponent implements OnInit {
  private saleSvc = inject(SaleService);
  private toast   = inject(ToastService);

  sales        = signal<SaleResponse[]>([]);
  loading      = signal(true);
  selectedSale = signal<SaleResponse | null>(null);

  totalSales = () => this.sales().reduce((s, sale) => s + sale.total, 0);
  totalItems = () => this.sales().reduce((s, sale) => s + sale.details.reduce((ss, d) => ss + d.quantity, 0), 0);

  ngOnInit() {
    this.saleSvc.getAll().subscribe({
      next: s  => { this.sales.set(s); this.loading.set(false); },
      error: err => { this.toast.error(extractApiError(err)); this.loading.set(false); }
    });
  }
}
