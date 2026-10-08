import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { PurchaseResponse, ProductResponse, SupplierResponse, PurchaseDetailRequest } from '../../../core/models';
import { CurrencyСoPipe } from '../../../shared/pipes/currency-co.pipe';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';

interface PurchaseItem { product: ProductResponse; quantity: number; unitCost: number; }

@Component({
  selector: 'app-purchase-management',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyСoPipe, DateEsPipe, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header flex-row justify-between items-start">
      <div>
        <h1 class="page-title">Compras a Proveedores</h1>
        <p class="page-subtitle">Registro de compras e historial</p>
      </div>
      <button (click)="showNew.set(!showNew())" class="btn btn-primary mt-1">
        @if (showNew()) {
          <app-icon name="arrow-left" [size]="15"/> Ver historial
        } @else {
          <app-icon name="plus" [size]="15"/> Nueva Compra
        }
      </button>
    </div>

    @if (showNew()) {
      <!-- New Purchase Form -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <!-- Supplier + Product search -->
          <div class="card p-4 space-y-4">
            <div class="form-group">
              <label class="form-label">Proveedor *</label>
              <select [(ngModel)]="selectedSupplierId" class="form-control">
                <option value="">Seleccionar proveedor...</option>
                @for (s of suppliers(); track s.id) {
                  <option [value]="s.id">{{ s.name }} — {{ s.nit }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Buscar producto</label>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="productSearch" (input)="searchProducts()"
                       class="form-control flex-1" placeholder="Nombre del producto..."/>
              </div>
              @if (searchResults().length > 0) {
                <div class="border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto mt-1">
                  @for (p of searchResults(); track p.id) {
                    <button (click)="addItem(p)"
                            class="w-full flex items-center justify-between px-4 py-2 hover:bg-blue-50 text-sm text-left border-b border-gray-50 last:border-b-0">
                      <span>{{ p.name }}</span>
                      <span class="text-text-secondary text-xs">Stock: {{ p.stock }}</span>
                    </button>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Items -->
          @if (items().length > 0) {
            <div class="card overflow-hidden">
              <div class="table-wrapper">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th class="text-right">Cantidad</th>
                      <th class="text-right">Costo unit.</th>
                      <th class="text-right">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of items(); track item.product.id) {
                      <tr>
                        <td class="font-medium text-sm">{{ item.product.name }}</td>
                        <td class="text-right">
                          <input type="number" [(ngModel)]="item.quantity" [min]="1"
                                 class="form-control w-20 text-right text-sm py-1 ml-auto"/>
                        </td>
                        <td class="text-right">
                          <input type="number" [(ngModel)]="item.unitCost" [min]="0"
                                 class="form-control w-28 text-right text-sm py-1 ml-auto"/>
                        </td>
                        <td class="text-right font-semibold text-sm">{{ (item.quantity * item.unitCost) | currencyCo }}</td>
                        <td>
                          <button (click)="removeItem(item.product.id)" class="btn btn-ghost btn-sm p-1 text-danger">
                            <app-icon name="trash-2" [size]="15"/>
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

        <!-- Summary -->
        <div class="card p-5">
          <h2 class="font-semibold mb-4">Resumen de compra</h2>
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
              <span>Total estimado</span>
              <span class="text-primary">{{ total() | currencyCo }}</span>
            </div>
          </div>
          <button (click)="submitPurchase()" [disabled]="items().length === 0 || !selectedSupplierId || processing()"
                  class="btn btn-primary w-full btn-lg mt-5">
            @if (processing()) {
              <app-icon name="loader" [size]="14" class="animate-spin"/> Procesando...
            } @else {
              Registrar Compra
            }
          </button>
          <button (click)="clearForm()" class="btn btn-ghost w-full mt-2 text-sm flex items-center justify-center gap-1">
            <app-icon name="trash-2" [size]="15"/> Limpiar
          </button>
        </div>
      </div>
    } @else {
      <!-- History -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
        </div>
      } @else if (purchases().length === 0) {
        <app-empty-state icon="" title="Sin compras registradas" subtitle="Registra la primera compra."/>
      } @else {
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>N° Compra</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th class="text-right">Total</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              @for (p of purchases(); track p.id) {
                <tr>
                  <td class="font-mono font-semibold">{{ p.purchaseNumber }}</td>
                  <td class="text-sm">{{ p.createdAt | dateEs:'short' }}</td>
                  <td class="text-sm">{{ p.supplierName ?? 'Proveedor #' + p.supplierId }}</td>
                  <td class="text-right font-bold text-primary">{{ p.total | currencyCo }}</td>
                  <td class="text-sm text-text-secondary">{{ p.details.length }} productos</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }
  `
})
export class PurchaseManagementComponent implements OnInit {
  private purchaseSvc = inject(PurchaseService);
  private productSvc  = inject(ProductService);
  private supplierSvc = inject(SupplierService);
  private toast       = inject(ToastService);
  private auth        = inject(AuthService);

  purchases     = signal<PurchaseResponse[]>([]);
  suppliers     = signal<SupplierResponse[]>([]);
  searchResults = signal<ProductResponse[]>([]);
  items         = signal<PurchaseItem[]>([]);
  loading       = signal(true);
  processing    = signal(false);
  showNew       = signal(false);

  productSearch      = '';
  selectedSupplierId = '';

  subtotal = computed(() => this.items().reduce((s, i) => s + i.quantity * i.unitCost, 0));
  tax      = computed(() => this.subtotal() * 0.19);
  total    = computed(() => this.subtotal() + this.tax());

  ngOnInit() {
    this.supplierSvc.getAll().subscribe({ next: s => this.suppliers.set(s) });
    this.loadPurchases();
  }

  loadPurchases() {
    this.loading.set(true);
    this.purchaseSvc.getAll().subscribe({
      next: p  => { this.purchases.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  searchProducts() {
    const q = this.productSearch.trim();
    if (!q) { this.searchResults.set([]); return; }
    this.productSvc.searchByName(q).subscribe({
      next: p => this.searchResults.set(p.filter(x => x.status)),
      error: () => this.searchResults.set([])
    });
  }

  addItem(p: ProductResponse) {
    const existing = this.items().find(i => i.product.id === p.id);
    if (!existing) this.items.update(l => [...l, { product: p, quantity: 1, unitCost: p.purchasePrice }]);
    this.productSearch = '';
    this.searchResults.set([]);
  }

  removeItem(id: number) { this.items.update(l => l.filter(i => i.product.id !== id)); }

  clearForm() {
    this.items.set([]);
    this.selectedSupplierId = '';
    this.productSearch = '';
    this.searchResults.set([]);
  }

  submitPurchase() {
    const user = this.auth.currentUser();
    if (!user || !this.selectedSupplierId || this.items().length === 0) return;
    this.processing.set(true);
    const details: PurchaseDetailRequest[] = this.items().map(i => ({
      productId: i.product.id,
      quantity:  i.quantity,
      unitCost:  i.unitCost
    }));
    this.purchaseSvc.create({
      supplierId: +this.selectedSupplierId,
      userId:     user.id,
      details
    }).subscribe({
      next: p => {
        this.toast.success(`Compra #${p.purchaseNumber} registrada exitosamente`);
        this.clearForm();
        this.showNew.set(false);
        this.loadPurchases();
        this.processing.set(false);
      },
      error: err => { this.toast.error(extractApiError(err)); this.processing.set(false); }
    });
  }
}
