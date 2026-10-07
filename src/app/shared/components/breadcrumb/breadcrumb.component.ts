import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

export interface BreadcrumbItem { label: string; link?: string; }

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <nav class="flex items-center gap-1 text-sm text-text-secondary mb-4 flex-wrap">
      @for (item of items; track $index; let last = $last) {
        @if (!last) {
          <a [routerLink]="item.link" class="hover:text-primary transition-colors cursor-pointer">{{ item.label }}</a>
          <app-icon name="chevron-right" [size]="14" class="text-gray-400"/>
        } @else {
          <span class="text-text-primary font-medium">{{ item.label }}</span>
        }
      }
    </nav>
  `
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
