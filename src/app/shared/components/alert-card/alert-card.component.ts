import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-alert-card',
  template: `
    <div class="alert-card" [class]="'border-' + (alert?.impact_level || alert?.severity || 'unknown')">
      <div class="card-header">
        <span class="entity">{{ alert?.bank_name || alert?.currency_pair || alert?.regulator || alert?.exception_id || 'Alert' }}</span>
        <app-impact-badge [level]="alert?.impact_level || alert?.severity || 'unknown'"></app-impact-badge>
        <span class="event-type">{{ alert?.event_type || alert?.exception_type || alert?.change_type }}</span>
      </div>
      <p class="summary">{{ alert?.summary || alert?.change_summary }}</p>
      <p class="impact" *ngIf="alert?.business_impact || alert?.commercial_impact">
        <strong>Impact:</strong> {{ alert?.business_impact || alert?.commercial_impact }}
      </p>
      <p class="action"><strong>Action:</strong> {{ alert?.recommended_action }}</p>
      <div class="card-footer">
        <a *ngIf="isUrl(alert?.source_reference)" [href]="alert?.source_reference" target="_blank" class="source-link">Source ↗</a>
        <span *ngIf="alert?.compliance_deadline" class="deadline">Deadline: {{ alert?.compliance_deadline }}</span>
        <span class="confidence" *ngIf="alert?.confidence_score">{{ (alert.confidence_score * 100).toFixed(0) }}% confidence</span>
      </div>
    </div>
  `,
  styles: [`
    .alert-card {
      background: var(--app-surface); border-radius: 10px; padding: 18px; margin-bottom: 12px;
      border: 1px solid var(--app-border);
      border-left: 4px solid var(--app-border);
    }
    .border-critical { border-left-color: #dc2626; }
    .border-high     { border-left-color: #ea580c; }
    .border-medium   { border-left-color: #d97706; }
    .border-low      { border-left-color: #16a34a; }
    .card-header     { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
    .entity          { font-weight: 700; font-size: 15px; color: var(--yellow); }
    .event-type      { font-size: 11px; color: var(--app-text-muted); margin-left: auto; background: rgba(255,255,255,0.05); padding: 3px 10px; border-radius: 6px; }
    .summary         { color: var(--app-text); font-size: 13px; margin: 6px 0; line-height: 1.6; }
    .impact          { color: var(--app-text-muted); font-size: 13px; margin: 4px 0; }
    .action          { color: var(--yellow); font-size: 13px; margin: 4px 0; }
    .card-footer     { display: flex; align-items: center; gap: 16px; margin-top: 10px; flex-wrap: wrap; }
    .source-link     { color: var(--yellow); font-size: 12px; text-decoration: none; }
    .source-link:hover { text-decoration: underline; }
    .deadline        { font-size: 12px; color: #f87171; font-weight: 600; }
    .confidence      { font-size: 12px; color: var(--app-text-muted); margin-left: auto; }
  `]
})
export class AlertCardComponent {
  @Input() alert: any;
  isUrl(s: string): boolean { return s?.startsWith('http'); }
}
