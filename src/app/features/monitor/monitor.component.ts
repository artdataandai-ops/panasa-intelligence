import { Component } from '@angular/core';
import { LyzrAgentService } from '../../core/services/lyzr-agent.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-monitor',
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Partner Bank Rate Monitor</h1>
        <p class="subtitle">Monitor rate changes across 60+ partner banks</p>
      </div>
      <div class="input-card">
        <h2>Search Bank or Ask Question</h2>
        <div class="input-row">
          <input [(ngModel)]="query" placeholder="e.g. 'HSBC rate changes 2026' or 'Compare old and new rate sheets'" (keyup.enter)="search()" />
          <button (click)="search()" [disabled]="loading || !query">{{ loading ? '...' : 'Search' }}</button>
        </div>
      </div>
      <div class="quick-buttons">
        <button *ngFor="let b of banks" (click)="quickSearch(b)" class="btn-bank">{{ b }}</button>
        <button (click)="weeklyMI()" class="btn-mi">Weekly MI Summary</button>
      </div>
      <div *ngIf="loading" class="loading"><div class="spinner"></div> Searching...</div>
      <div *ngIf="error" class="error-bar">{{ error }}</div>
      <div *ngIf="response" class="response-card">
        <div class="response-label">Rate Monitor Response</div>
        <pre class="response-body">{{ response }}</pre>
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
    .input-row { display: flex; gap: 10px; }
    input {
      flex: 1; padding: 11px 14px; border: 1px solid var(--app-input-border);
      border-radius: 8px; font-size: 13px; background: var(--app-main-bg); color: var(--app-text);
    }
    button {
      background: var(--yellow); color: #1a1a1a; border: none; padding: 11px 20px;
      border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: background 0.2s;
    }
    button:hover { background: var(--yellow-dark); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .quick-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .btn-bank {
      background: var(--app-main-bg); border: 1px solid var(--app-btn-outline-border); padding: 9px 18px;
      border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--app-btn-outline-text); transition: all 0.2s;
    }
    .btn-bank:hover { background: var(--app-btn-outline-hover-bg); border-color: var(--yellow); color: var(--yellow); }
    .btn-mi {
      background: var(--yellow); color: #1a1a1a; border: none; padding: 9px 18px;
      border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: background 0.2s;
    }
    .btn-mi:hover { background: var(--yellow-dark); }
    .loading { display: flex; align-items: center; gap: 10px; padding: 16px; color: var(--app-text-muted); }
    .spinner {
      width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.08);
      border-top-color: var(--yellow); border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-bar { background: rgba(220,38,38,0.08); color: #f87171; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; }
    .response-card {
      background: var(--app-surface); border-radius: 10px; padding: 22px;
      border: 1px solid var(--app-border);
    }
    .response-label { font-size: 11px; color: var(--app-text-muted); margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .response-body { white-space: pre-wrap; font-family: 'Segoe UI', Arial; font-size: 13px; color: var(--app-text); line-height: 1.7; margin: 0; }
  `]
})
export class MonitorComponent {
  query = ''; response = ''; loading = false; error: string | null = null;
  banks = ['HSBC', 'Barclays', 'NatWest', 'Lloyds', 'Santander'];
  constructor(private lyzr: LyzrAgentService) {}
  search() {
    this.loading = true; this.error = null;
    this.lyzr.callAgent(environment.agents['monitor'], this.query).subscribe({
      next: (res) => { this.response = res.response; this.loading = false; },
      error: (err: any) => { this.error = err.message || 'Unable to fetch rate data. Please try again.'; this.loading = false; }
    });
  }
  quickSearch(bank: string) { this.query = `Search for latest ${bank} UK rate changes 2026 and classify business impact`; this.search(); }
  weeklyMI() { this.query = 'Generate weekly MI summary covering all rate changes and external news this week'; this.search(); }
}
