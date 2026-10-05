import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ProductResponse, ProductRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll()                              { return this.http.get<ProductResponse[]>(`${this.api}/products`); }
  getById(id: number)                   { return this.http.get<ProductResponse>(`${this.api}/products/${id}`); }
  searchByName(name: string)            { return this.http.get<ProductResponse[]>(`${this.api}/products/search?name=${encodeURIComponent(name)}`); }
  searchByBarcode(barcode: string)      { return this.http.get<ProductResponse>(`${this.api}/products/barcode/${encodeURIComponent(barcode)}`); }
  getByCategory(categoryId: number)     { return this.http.get<ProductResponse[]>(`${this.api}/products/category/${categoryId}`); }
  getLowStock()                         { return this.http.get<ProductResponse[]>(`${this.api}/products/low-stock`); }

  create(body: ProductRequest)          { return this.http.post<ProductResponse>(`${this.api}/products`, body); }
  update(id: number, body: ProductRequest) { return this.http.put<ProductResponse>(`${this.api}/products/${id}`, body); }
  toggle(id: number)                    { return this.http.patch<ProductResponse>(`${this.api}/products/${id}/toggle`, {}); }
}
