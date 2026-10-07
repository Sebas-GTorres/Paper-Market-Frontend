import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (type === 'table') {
      <div class="space-y-2">
        @for (row of rows; track $index) {
          <div class="flex gap-4">
            @for (col of cols; track $index) {
              <div class="skeleton h-9 flex-1 rounded-lg"></div>
            }
          </div>
        }
      </div>
    } @else if (type === 'card') {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (item of rows; track $index) {
          <div class="card p-5 space-y-3">
            <div class="skeleton h-10 w-10 rounded-xl"></div>
            <div class="skeleton h-7 w-24 rounded"></div>
            <div class="skeleton h-4 w-32 rounded"></div>
          </div>
        }
      </div>
    } @else {
      <div class="skeleton rounded-lg" [style.height]="height" [style.width]="width"></div>
    }
  `
})
export class SkeletonComponent {
  @Input() type: 'table' | 'card' | 'block' = 'block';
  @Input() rowCount = 5;
  @Input() colCount = 4;
  @Input() height = '40px';
  @Input() width  = '100%';

  get rows() { return Array(this.rowCount); }
  get cols()  { return Array(this.colCount); }
}
