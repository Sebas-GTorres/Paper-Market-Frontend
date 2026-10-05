import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PurchaseResponse, CreatePurchaseRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll()                          { return this.http.get<PurchaseResponse[]>(`${this.api}/purchases`); }
  getById(id: number)               { return this.http.get<PurchaseResponse>(`${this.api}/purchases/${id}`); }
  getBySupplier(supplierId: number) { return this.http.get<PurchaseResponse[]>(`${this.api}/purchases/supplier/${supplierId}`); }
  create(body: CreatePurchaseRequest){ return this.http.post<PurchaseResponse>(`${this.api}/purchases`, body); }
}
