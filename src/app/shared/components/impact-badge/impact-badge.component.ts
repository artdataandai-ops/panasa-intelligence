import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-impact-badge',
  template: `<span [class]="'badge badge-' + level">{{ level | uppercase }}</span>`,
  styles: [`
    .badge { padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
    .badge-critical { background: rgba(220,38,38,0.15); color: #f87171; }
    .badge-high     { background: rgba(234,88,12,0.15); color: #fb923c; }
    .badge-medium   { background: rgba(217,119,6,0.15); color: #fbbf24; }
    .badge-low      { background: rgba(22,163,74,0.15); color: #4ade80; }
    .badge-unknown  { background: rgba(107,114,128,0.15); color: #9ca3af; }
  `]
})
export class ImpactBadgeComponent {
  @Input() level: string = 'unknown';
}
