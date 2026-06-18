import { Component } from '@angular/core';
import { LyzrAgentService } from '../../core/services/lyzr-agent.service';
import { environment } from '../../../environments/environment';
import { SettlementAlert } from '../../core/models/models';

@Component({
  selector: 'app-settlement',
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Settlement Exception Monitor</h1>
        <p class="subtitle">Detect and resolve multi-currency settlement exceptions</p>
      </div>

      <div class="input-card">
        <h2>Report an Exception</h2>
        <textarea [(ngModel)]="exceptionInput" rows="4"
          placeholder="Describe the exception. Example: A GBP/USD FX trade for GBP 500,000 (ref FX-2026-001) was confirmed at 09:30 GMT. USD settlement expected by 10:00 GMT. Not received by 10:30 GMT.">
        </textarea>
        <button (click)="analyseException()" [disabled]="loading || !exceptionInput" class="btn-primary">
          {{ loading ? 'Analysing...' : 'Analyse Exception' }}
        </button>
      </div>

      <div class="quick-tests">
        <h2>Quick Test Cases</h2>
        <div class="test-buttons">
          <button *ngFor="let t of testCases" (click)="runTest(t)" class="btn-test">{{ t.label }}</button>
        </div>
      </div>

      <div *ngIf="error" class="error-bar">{{ error }}</div>
      <div *ngIf="loading" class="loading-bar"><div class="spinner"></div> Analysing exception...</div>

      <div *ngIf="alerts.length > 0" class="results">
        <h2>Exception Alerts</h2>
        <div *ngFor="let alert of alerts" class="exception-card" [class]="'border-' + alert.severity">
          <div class="exc-header">
            <span class="exc-id">{{ alert.exception_id }}</span>
            <app-impact-badge [level]="alert.severity"></app-impact-badge>
            <span class="exc-type">{{ alert.exception_type }}</span>
          </div>
          <div class="exc-body">
            <p><strong>{{ alert.currency_pair }}</strong> — {{ alert.base_currency }} {{ alert.amount | number }}</p>
            <p>{{ alert.summary }}</p>
            <p class="timeline">{{ alert.timeline }}</p>
            <p class="action"><strong>Action:</strong> {{ alert.recommended_action }}</p>
            <div *ngIf="alert.escalate_to && alert.escalate_to.length > 0" class="escalate">
              <strong>Escalate to:</strong>
              <span *ngFor="let e of alert.escalate_to" class="escalate-tag">{{ e }}</span>
            </div>
            <p class="status">Status: <strong>{{ alert.resolution_status }}</strong></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; }
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; color: var(--app-heading); margin: 0 0 4px; }
    h2 { font-size: 15px; color: var(--app-heading); margin: 0 0 14px; }
    .subtitle { color: var(--app-text-muted); font-size: 13px; margin: 0; }
    .input-card {
      background: var(--app-surface); border-radius: 10px; padding: 22px; margin-bottom: 16px;
      border: 1px solid var(--app-border);
    }
    textarea {
      width: 100%; padding: 12px 14px; border: 1px solid var(--app-input-border);
      border-radius: 8px; font-size: 13px; resize: vertical; margin-bottom: 12px;
      box-sizing: border-box; background: var(--app-main-bg); color: var(--app-text);
    }
    .btn-primary {
      background: var(--yellow); color: #1a1a1a; border: none; padding: 11px 22px;
      border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: background 0.2s;
    }
    .btn-primary:hover { background: var(--yellow-dark); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .quick-tests {
      background: var(--app-surface); border-radius: 10px; padding: 22px; margin-bottom: 20px;
      border: 1px solid var(--app-border);
    }
    .test-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
    .btn-test {
      background: var(--app-main-bg); border: 1px solid var(--app-btn-outline-border); padding: 9px 16px;
      border-radius: 8px; cursor: pointer; font-size: 12px; color: var(--app-btn-outline-text); transition: all 0.2s;
    }
    .btn-test:hover { background: var(--app-btn-outline-hover-bg); border-color: var(--yellow); color: var(--yellow); }
    .error-bar {
      background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.25); color: #f87171;
      padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px;
    }
    .loading-bar { display: flex; align-items: center; gap: 10px; padding: 16px; color: var(--app-text-muted); font-size: 13px; }
    .spinner {
      width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.08);
      border-top-color: var(--yellow); border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .exception-card {
      background: var(--app-surface); border-radius: 10px; padding: 18px; margin-bottom: 12px;
      border: 1px solid var(--app-border); border-left: 4px solid rgba(255,255,255,0.1);
    }
    .border-critical { border-left-color: #dc2626; }
    .border-high { border-left-color: #ea580c; }
    .border-medium { border-left-color: #d97706; }
    .border-low { border-left-color: #16a34a; }
    .exc-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .exc-id { font-weight: 700; font-size: 14px; color: var(--yellow); }
    .exc-type { font-size: 11px; background: rgba(255,255,255,0.05); padding: 3px 10px; border-radius: 6px; color: var(--app-text-muted); margin-left: auto; }
    .exc-body p { font-size: 13px; color: var(--app-text); margin: 4px 0; }
    .timeline { color: var(--app-text-muted); font-style: italic; white-space: pre-line; }
    .action { color: var(--yellow); }
    .escalate { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 8px 0; }
    .escalate-tag { background: rgba(220,38,38,0.12); color: #f87171; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .status { font-size: 12px; color: var(--app-text-muted); }
    .results h2 { font-size: 15px; color: var(--app-heading); margin-bottom: 12px; }
  `]
})
export class SettlementComponent {
  exceptionInput = '';
  alerts: SettlementAlert[] = [];
  loading = false;
  error: string | null = null;

  testCases = [
    { label: '🔴 Failed FX Leg (Critical)', prompt: 'A GBP/USD FX trade for GBP 1,500,000 (ref HSBC-FX-2026-001) was confirmed at 09:30 GMT. USD settlement expected by 10:00 GMT. Not received by 10:30 GMT.' },
    { label: '🟡 Cut-Off Miss (Medium)', prompt: 'A client submitted a GBP 250,000 withdrawal at 14:05 GMT. CHAPS cut-off was 14:00 GMT. Client submitted late.' },
    { label: '🟠 Unexpected Debit (High)', prompt: 'End of day reconciliation shows an unidentified GBP 85,000 debit. No matching instruction in system.' },
    { label: '🟠 Currency Mismatch (High)', prompt: 'Client instructed GBP to EUR conversion. Expected EUR 580,000. Received USD 580,000 instead. Financial impact GBP 12,000.' },
    { label: '🟢 Low Value Timing (Low)', prompt: 'Account balance is GBP 450 below expected. Suspected overnight interest timing difference.' }
  ];

  constructor(private lyzr: LyzrAgentService) {}

  analyseException() {
    this.loading = true;
    this.error = null;
    this.lyzr.callAgent(environment.agents['settlement'], this.exceptionInput).subscribe({
      next: (res) => {
        const parsed = this.lyzr.parseJSON<SettlementAlert>(res);
        if (parsed) {
          this.alerts = [parsed, ...this.alerts];
        } else {
          this.alerts = [{
            event_type: 'Analysis',
            summary: res.response,
            severity: 'low',
            currency_pair: '',
            amount: 0,
            base_currency: '',
            timeline: '',
            recommended_action: '',
            resolution_status: 'pending',
            escalate_to: []
          } as any, ...this.alerts];
        }
        this.loading = false;
      },
      error: (err: any) => { this.error = err.message || 'Unable to analyse the exception. Please try again.'; this.loading = false; }
    });
  }

  runTest(t: { label: string; prompt: string }) {
    this.exceptionInput = t.prompt;
    this.analyseException();
  }
}
