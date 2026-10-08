import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { OrderService } from '../../../core/services/order.service';
import { SaleService } from '../../../core/services/sale.service';
import { ProductResponse, OrderResponse, SaleResponse, OrderStatus } from '../../../core/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface KpiCard { label: string; value: string; icon: string; colorBg: string; colorText: string; }

const ORDER_STATUSES: OrderStatus[] = ['PENDING','PAID','PREPARING','SHIPPED','DELIVERED','CANCELED'];
const STATUS_LABELS: Record<string, string> = {
  PENDING:'Pendiente', PAID:'Pagado', PREPARING:'Preparando',
  SHIPPED:'Enviado', DELIVERED:'Entregado', CANCELED:'Cancelado'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Resumen general del sistema</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else {

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        @for (kpi of kpis(); track kpi.label) {
          <div class="kpi-card">
            <div class="kpi-icon" [ngClass]="kpi.colorBg">
              <app-icon [name]="kpi.icon" [size]="22" [ngClass]="kpi.colorText"/>
            </div>
            <div>
              <p class="kpi-value">{{ kpi.value }}</p>
              <p class="kpi-label">{{ kpi.label }}</p>
            </div>
          </div>
        }
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Pedidos por estado -->
        <div class="card p-6">
          <h2 class="font-bold text-text-primary mb-5">Pedidos por estado</h2>
          <div class="space-y-3">
            @for (entry of ordersByStatus(); track entry.status) {
              <div class="flex items-center gap-3">
                <span class="text-xs font-medium w-24 shrink-0 text-text-secondary">{{ entry.label }}</span>
                <div class="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-700"
                       [ngClass]="entry.color"
                       [style.width.%]="entry.percent"></div>
                </div>
                <span class="text-sm font-bold w-7 text-right text-text-primary">{{ entry.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Top 5 productos -->
        <div class="card p-6">
          <h2 class="font-bold text-text-primary mb-5">Top 5 productos más pedidos</h2>
          <div class="space-y-3">
            @for (item of topProducts(); track item.productId; let i = $index) {
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      [ngClass]="i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'">
                  {{ i + 1 }}
                </span>
                <span class="flex-1 text-sm font-medium text-text-primary truncate">{{ item.name }}</span>
                <span class="badge badge-primary shrink-0">{{ item.count }}</span>
              </div>
            }
            @if (topProducts().length === 0) {
              <p class="text-sm text-text-secondary text-center py-6">Sin datos de pedidos aún</p>
            }
          </div>
        </div>

        <!-- Alertas de stock bajo -->
        <div class="card p-6 lg:col-span-2">
          <div class="flex items-center gap-2 mb-4">
            <app-icon name="alert-triangle" [size]="18" class="text-warning"/>
            <h2 class="font-bold text-text-primary">Productos con stock bajo</h2>
          </div>
          @if (lowStockProducts().length === 0) {
            <div class="flex items-center gap-2 text-success text-sm font-medium">
              <app-icon name="check-circle" [size]="16"/>
              Todos los productos tienen stock suficiente
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              @for (p of lowStockProducts(); track p.id) {
                <div class="flex items-center gap-3 p-3 rounded-lg border"
                     [ngClass]="p.stock === 0 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'">
                  <app-icon [name]="p.stock === 0 ? 'package-x' : 'alert-triangle'" [size]="18"
                             [ngClass]="p.stock === 0 ? 'text-danger shrink-0' : 'text-warning shrink-0'"/>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-text-primary truncate">{{ p.name }}</p>
                    <p class="text-xs" [ngClass]="p.stock === 0 ? 'text-danger' : 'text-warning'">
                      Stock: {{ p.stock }} / Mín: {{ p.minimumStock }}
                    </p>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `
})
export class DashboardComponent implements OnInit {
  private productSvc = inject(ProductService);
  private orderSvc   = inject(OrderService);
  private saleSvc    = inject(SaleService);

  loading          = signal(true);
  kpis             = signal<KpiCard[]>([]);
  ordersByStatus   = signal<any[]>([]);
  topProducts      = signal<any[]>([]);
  lowStockProducts = signal<ProductResponse[]>([]);

  ngOnInit() {
    forkJoin({
      products: this.productSvc.getAll(),
      lowStock: this.productSvc.getLowStock(),
      orders:   this.orderSvc.getAll(),
      sales:    this.saleSvc.getAll(),
    }).subscribe({
      next: ({ products, lowStock, orders, sales }) => {
        this.buildKpis(products, lowStock, orders, sales);
        this.buildOrdersByStatus(orders);
        this.buildTopProducts(orders);
        this.lowStockProducts.set(lowStock.slice(0, 12));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private buildKpis(products: ProductResponse[], lowStock: ProductResponse[], orders: OrderResponse[], sales: SaleResponse[]) {
    const totalSales = sales.reduce((s, sale) => s + sale.total, 0);
    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    this.kpis.set([
      { label: 'Total Productos', value: String(products.length), icon: 'package',          colorBg: 'bg-blue-100',   colorText: 'text-blue-600' },
      { label: 'Stock Bajo',      value: String(lowStock.length),  icon: 'alert-triangle',   colorBg: 'bg-orange-100', colorText: 'text-warning' },
      { label: 'Total Pedidos',   value: String(orders.length),    icon: 'clipboard-list',   colorBg: 'bg-purple-100', colorText: 'text-purple-600' },
      { label: 'Total Ventas',    value: fmt.format(totalSales),   icon: 'trending-up',      colorBg: 'bg-green-100',  colorText: 'text-success' },
    ]);
  }

  private buildOrdersByStatus(orders: OrderResponse[]) {
    const statusColors: Record<string, string> = {
      PENDING:'bg-orange-400', PAID:'bg-blue-500', PREPARING:'bg-yellow-400',
      SHIPPED:'bg-gray-400', DELIVERED:'bg-green-500', CANCELED:'bg-red-400'
    };
    const total = orders.length || 1;
    this.ordersByStatus.set(ORDER_STATUSES.map(status => ({
      status,
      label:   STATUS_LABELS[status],
      count:   orders.filter(o => o.status === status).length,
      percent: Math.round((orders.filter(o => o.status === status).length / total) * 100),
      color:   statusColors[status]
    })));
  }

  private buildTopProducts(orders: OrderResponse[]) {
    const countMap = new Map<number, number>();
    const nameMap  = new Map<number, string>();
    orders.forEach(o => o.details?.forEach(d => {
      countMap.set(d.productId, (countMap.get(d.productId) ?? 0) + d.quantity);
      nameMap.set(d.productId, d.productName);
    }));
    this.topProducts.set(
      Array.from(countMap.entries())
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([productId, count]) => ({ productId, name: nameMap.get(productId) ?? `#${productId}`, count }))
    );
  }
}
