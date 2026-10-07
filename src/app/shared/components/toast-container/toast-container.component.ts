import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      @for (toast of svc.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-modal text-sm font-medium animate-slide-in border"
          [ngClass]="{
            'bg-green-50 text-green-800 border-green-200': toast.type === 'success',
            'bg-red-50   text-red-800   border-red-200':   toast.type === 'error',
            'bg-orange-50 text-orange-800 border-orange-200': toast.type === 'warning',
            'bg-blue-50  text-blue-800  border-blue-200':  toast.type === 'info'
          }">
          <span class="mt-0.5 shrink-0">
            @if (toast.type === 'success') { <app-icon name="check-circle" [size]="18"/> }
            @else if (toast.type === 'error') { <app-icon name="x-circle" [size]="18"/> }
            @else if (toast.type === 'warning') { <app-icon name="alert-triangle" [size]="18"/> }
            @else { <app-icon name="info" [size]="18"/> }
          </span>
          <p class="flex-1 leading-snug">{{ toast.message }}</p>
          <button
            (click)="svc.remove(toast.id)"
            class="text-current opacity-60 hover:opacity-100 transition-opacity shrink-0 mt-0.5">
            <app-icon name="x" [size]="16"/>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  svc = inject(ToastService);
}
