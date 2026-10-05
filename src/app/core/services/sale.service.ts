import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SaleResponse, CreateSaleRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll()                       { return this.http.get<SaleResponse[]>(`${this.api}/sales`); }
  getById(id: number)            { return this.http.get<SaleResponse>(`${this.api}/sales/${id}`); }
  getByUser(userId: number)      { return this.http.get<SaleResponse[]>(`${this.api}/sales/user/${userId}`); }
  create(body: CreateSaleRequest){ return this.http.post<SaleResponse>(`${this.api}/sales`, body); }
}
