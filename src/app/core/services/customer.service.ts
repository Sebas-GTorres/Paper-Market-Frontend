import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CustomerResponse, CustomerRequest, CustomerStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll()                                    { return this.http.get<CustomerResponse[]>(`${this.api}/customers`); }
  getById(id: number)                         { return this.http.get<CustomerResponse>(`${this.api}/customers/${id}`); }
  getByDocument(document: string)             { return this.http.get<CustomerResponse>(`${this.api}/customers/document/${encodeURIComponent(document)}`); }
  findByUserId(userId: number)                { return this.http.get<CustomerResponse>(`${this.api}/customers/user/${userId}`); }
  create(body: CustomerRequest)               { return this.http.post<CustomerResponse>(`${this.api}/customers`, body); }
  update(id: number, body: CustomerRequest)   { return this.http.put<CustomerResponse>(`${this.api}/customers/${id}`, body); }
  changeStatus(id: number, status: CustomerStatus) {
    return this.http.patch<CustomerResponse>(`${this.api}/customers/${id}/status?status=${status}`, {});
  }
}
