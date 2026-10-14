import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CustomerService } from '../../../core/services/customer.service';
import { SaleService } from '../../../core/services/sale.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductResponse, CustomerResponse, SaleDetailRequest } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

const TAX_RATE = 0.19;
interface PosItem { product: ProductResponse; quantity: number; }

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyСoPipe, IconComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Punto de Venta</h1>
      <p class="page-subtitle">Registro de ventas en mostrador</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Busqueda y lista -->
      <div class="lg:col-span-2 space-y-4">
        <div class="card p-4">
          <h2 class="font-semibold mb-3 text-text-primary">Agregar producto</h2>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <app-icon name="search" [size]="16"/>
            </span>
            <input type="text" [(ngModel)]="productSearch" (input)="onProductSearch()"
                   class="search-input" placeholder="Nombre del producto..."/>
          </div>

          @if (searchResults().length > 0) {
            <div class="mt-2 border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              @for (p of searchResults(); track p.id) {
                <button (click)="addItem(p)"
                        class="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-sm text-left border-b border-gray-50 last:border-0 transition-colors">
                  <div class="flex items-center gap-2">
                    <app-icon name="package" [size]="14" class="text-text-secondary shrink-0"/>
                    <div>
                      <span class="font-medium text-text-primary">{{ p.name }}</span>
                      @if (p.brand) { <span class="text-text-secondary ml-2">{{ p.brand }}</span> }
                    </div>
                  </div>
                  <div class="text-right shrink-0 ml-4">
                    <span class="font-bold text-primary">{{ p.salePrice | currencyCo }}</span>
                    <span class="ml-2 text-xs" [ngClass]="p.stock === 0 ? 'text-danger' : 'text-success'">
                      {{ p.stock }} uds
                    </span>
                  </div>
                </button>
              }
            </div>
          }
        </div>

        <!-- Items en la venta -->
        @if (items().length > 0) {
          <div class="card overflow-hidden">
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="text-right">Precio</th>
                    <th class="text-center">Cantidad</th>
                    <th class="text-right">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of items(); track item.product.id) {
                    <tr>
                      <td>
                        <p class="font-medium text-text-primary text-sm">{{ item.product.name }}</p>
                        @if (item.product.brand) {
                          <p class="text-xs text-text-secondary">{{ item.product.brand }}</p>
                        }
                      </td>
                      <td class="text-right text-sm">{{ item.product.salePrice | currencyCo }}</td>
                      <td class="text-center">
                        <div class="flex items-center justify-center gap-1">
                          <button (click)="updateQty(item, item.quantity - 1)"
                                  class="btn btn-ghost btn-sm w-7 h-7 p-0">
                            <app-icon name="minus" [size]="13"/>
                          </button>
                          <input type="number" [(ngModel)]="item.quantity" [min]="1" [max]="item.product.stock"
                                 class="w-12 text-center form-control text-sm py-1"/>
                          <button (click)="updateQty(item, item.quantity + 1)"
                                  class="btn btn-ghost btn-sm w-7 h-7 p-0">
                            <app-icon name="plus" [size]="13"/>
                          </button>
                        </div>
                      </td>
                      <td class="text-right font-semibold text-sm">
                        {{ (item.product.salePrice * item.quantity) | currencyCo }}
                      </td>
                      <td>
                        <button (click)="removeItem(item.product.id)"
                                class="btn btn-ghost btn-sm p-1 text-danger hover:bg-red-50">
                          <app-icon name="trash-2" [size]="14"/>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>

      <!-- Panel derecho -->
      <div class="space-y-4">

        <!-- Cliente -->
        <div class="card p-4">
          <h2 class="font-semibold mb-3 text-text-primary">Cliente (opcional)</h2>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <app-icon name="id-card" [size]="15"/>
              </span>
              <input type="text" [(ngModel)]="customerDoc"
                     class="form-control pl-9 text-sm" placeholder="Documento..."/>
            </div>
            <button (click)="lookupCustomer()" class="btn btn-outline btn-sm whitespace-nowrap gap-1">
              <app-icon name="search" [size]="14"/> Buscar
            </button>
          </div>
          @if (customer()) {
            <div class="mt-2 p-3 bg-green-50 rounded-xl text-sm border border-green-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-green-800">
                  <app-icon name="user-check" [size]="15"/>
                  <span class="font-medium">{{ customer()!.names }} {{ customer()!.surnames }}</span>
                </div>
                <button (click)="customer.set(null)"
                        class="text-danger hover:bg-red-100 rounded p-0.5 transition-colors">
                  <app-icon name="x" [size]="14"/>
                </button>
              </div>
              <p class="text-green-600 text-xs mt-0.5 ml-5">{{ customer()!.document }}</p>
            </div>
          }
        </div>

        <!-- Totales y accion -->
        <div class="card p-5">
          <h2 class="font-semibold mb-4 text-text-primary">Resumen de venta</h2>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-text-secondary">Subtotal</span>
              <span>{{ subtotal() | currencyCo }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-text-secondary">Descuento (%)</span>
              <div class="flex items-center gap-1 w-24">
                <app-icon name="percent" [size]="13" class="text-text-secondary shrink-0"/>
                <input type="number" [(ngModel)]="discountPercent" [min]="0" [max]="100"
                       class="form-control text-right text-sm py-1"/>
              </div>
            </div>
            @if (discountPercent > 0) {
              <div class="flex justify-between text-warning">
                <span>Descuento</span>
                <span>- {{ discountAmount() | currencyCo }}</span>
              </div>
            }
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

          <button (click)="processSale()" [disabled]="items().length === 0 || processing()"
                  class="btn btn-success w-full btn-lg mt-5 gap-2">
            @if (processing()) {
              <app-icon name="loader" [size]="16" class="animate-spin"/> Procesando...
            } @else {
              <app-icon name="check-circle" [size]="16"/> Registrar Venta
            }
          </button>
          <button (click)="clearSale()" class="btn btn-ghost w-full mt-2 text-sm gap-1.5">
            <app-icon name="trash" [size]="14"/> Limpiar venta
          </button>
        </div>
      </div>
    </div>
  `
})
export class PosComponent implements OnInit {
  private productSvc  = inject(ProductService);
  private customerSvc = inject(CustomerService);
  private saleSvc     = inject(SaleService);
  private toast       = inject(ToastService);
  private auth        = inject(AuthService);

  items         = signal<PosItem[]>([]);
  searchResults = signal<ProductResponse[]>([]);
  customer      = signal<CustomerResponse | null>(null);
  processing    = signal(false);

  productSearch   = '';
  customerDoc     = '';
  discountPercent = 0;

  subtotal      = computed(() => this.items().reduce((s, i) => s + i.product.salePrice * i.quantity, 0));
  discountAmount= computed(() => this.subtotal() * (this.discountPercent / 100));
  tax           = computed(() => (this.subtotal() - this.discountAmount()) * TAX_RATE);
  total         = computed(() => this.subtotal() - this.discountAmount() + this.tax());

  ngOnInit() {}

  onProductSearch() {
    const q = this.productSearch.trim();
    if (!q) { this.searchResults.set([]); return; }
    this.productSvc.searchByName(q).subscribe({
      next: p => this.searchResults.set(p.filter(x => x.status && x.stock > 0)),
      error: () => this.searchResults.set([])
    });
  }

  addItem(product: ProductResponse) {
    const existing = this.items().find(i => i.product.id === product.id);
    if (existing) { this.updateQty(existing, existing.quantity + 1); }
    else { this.items.update(l => [...l, { product, quantity: 1 }]); }
    this.productSearch = '';
    this.searchResults.set([]);
  }

  updateQty(item: PosItem, qty: number) {
    if (qty < 1 || qty > item.product.stock) return;
    this.items.update(l => l.map(i => i.product.id === item.product.id ? { ...i, quantity: qty } : i));
  }

  removeItem(productId: number) { this.items.update(l => l.filter(i => i.product.id !== productId)); }

  lookupCustomer() {
    const doc = this.customerDoc.trim();
    if (!doc) return;
    this.customerSvc.getByDocument(doc).subscribe({
      next: c   => { this.customer.set(c); this.toast.success(`Cliente: ${c.names} ${c.surnames}`); },
      error: err => this.toast.error(extractApiError(err))
    });
  }

  processSale() {
    const user = this.auth.currentUser();
    if (!user || this.items().length === 0) return;
    this.processing.set(true);
    const details: SaleDetailRequest[] = this.items().map(i => ({ productId: i.product.id, quantity: i.quantity }));
    this.saleSvc.create({ customerId: this.customer()?.id ?? null, userId: user.id, discountPercent: this.discountPercent, details }).subscribe({
      next: sale => {
        const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
        this.toast.success(`Venta #${sale.saleNumber} registrada: ${fmt.format(sale.total)}`);
        this.clearSale();
        this.processing.set(false);
      },
      error: err => { this.toast.error(extractApiError(err)); this.processing.set(false); }
    });
  }

  clearSale() {
    this.items.set([]); this.customer.set(null);
    this.customerDoc = ''; this.discountPercent = 0; this.searchResults.set([]);
  }
}
