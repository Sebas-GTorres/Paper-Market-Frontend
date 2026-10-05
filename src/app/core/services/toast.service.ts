import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  private add(type: ToastType, message: string, duration = 4000) {
    const id = crypto.randomUUID();
    this.toasts.update(t => [...t, { id, type, message, duration }]);
    if (duration > 0) setTimeout(() => this.remove(id), duration);
  }

  success(message: string, duration?: number) { this.add('success', message, duration); }
  error(message: string, duration?: number)   { this.add('error',   message, duration); }
  warning(message: string, duration?: number) { this.add('warning', message, duration); }
  info(message: string, duration?: number)    { this.add('info',    message, duration); }

  remove(id: string) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
