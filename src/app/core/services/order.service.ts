import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { OrderResponse, CreateOrderRequest, UpdateOrderStatusRequest, OrderStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll()                                   { return this.http.get<OrderResponse[]>(`${this.api}/orders`); }
  getById(id: number)                        { return this.http.get<OrderResponse>(`${this.api}/orders/${id}`); }
  getByNumber(orderNumber: string)           { return this.http.get<OrderResponse>(`${this.api}/orders/number/${orderNumber}`); }
  getByStatus(status: OrderStatus)           { return this.http.get<OrderResponse[]>(`${this.api}/orders/status/${status}`); }
  getByCustomer(customerId: number)          { return this.http.get<OrderResponse[]>(`${this.api}/orders/customer/${customerId}`); }

  create(body: CreateOrderRequest)           { return this.http.post<OrderResponse>(`${this.api}/orders`, body); }
  updateStatus(id: number, body: UpdateOrderStatusRequest) {
    return this.http.patch<OrderResponse>(`${this.api}/orders/${id}/status`, body);
  }
  cancel(id: number, customerId: number) {
    return this.http.delete<void>(`${this.api}/orders/${id}/cancel?customerId=${customerId}`);
  }
}
