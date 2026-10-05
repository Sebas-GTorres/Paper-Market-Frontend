import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SupplierResponse, SupplierRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll()                               { return this.http.get<SupplierResponse[]>(`${this.api}/suppliers`); }
  getById(id: number)                    { return this.http.get<SupplierResponse>(`${this.api}/suppliers/${id}`); }
  getByNit(nit: string)                  { return this.http.get<SupplierResponse>(`${this.api}/suppliers/nit/${encodeURIComponent(nit)}`); }
  create(body: SupplierRequest)          { return this.http.post<SupplierResponse>(`${this.api}/suppliers`, body); }
  update(id: number, body: SupplierRequest) { return this.http.put<SupplierResponse>(`${this.api}/suppliers/${id}`, body); }
  toggle(id: number)                     { return this.http.patch<SupplierResponse>(`${this.api}/suppliers/${id}/toggle`, {}); }
}
