import { Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center text-text-secondary">
      <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <app-icon [name]="icon" [size]="32"/>
      </div>
      <h3 class="text-base font-semibold text-text-primary mb-1">{{ title }}</h3>
      <p class="text-sm max-w-xs">{{ subtitle }}</p>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon     = 'inbox';
  @Input() title    = 'Sin resultados';
  @Input() subtitle = 'No se encontraron elementos para mostrar.';
}
