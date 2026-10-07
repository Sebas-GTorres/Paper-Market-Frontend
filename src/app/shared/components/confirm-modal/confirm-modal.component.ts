import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (visible) {
      <div class="overlay" (click)="onBackdrop($event)">
        <div class="modal modal-sm p-6 text-center" (click)="$event.stopPropagation()">
          <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
               [ngClass]="danger ? 'bg-red-100 text-danger' : 'bg-blue-100 text-primary'">
            <app-icon [name]="danger ? 'trash-2' : 'alert-circle'" [size]="28"/>
          </div>
          <h3 class="text-lg font-semibold text-text-primary mb-2">{{ title }}</h3>
          <p class="text-sm text-text-secondary mb-6">{{ message }}</p>
          <div class="flex gap-3 justify-center">
            <button class="btn btn-ghost" (click)="cancel.emit()">Cancelar</button>
            <button
              class="btn"
              [ngClass]="danger ? 'btn-danger' : 'btn-primary'"
              (click)="confirm.emit()">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  @Input() visible      = false;
  @Input() title        = '¿Está seguro?';
  @Input() message      = 'Esta acción no se puede deshacer.';
  @Input() confirmLabel = 'Confirmar';
  @Input() danger       = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel  = new EventEmitter<void>();

  onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.cancel.emit();
  }
}
