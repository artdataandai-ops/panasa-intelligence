import { Component } from '@angular/core';
import { LyzrAgentService } from '../../core/services/lyzr-agent.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-scheme-compliance',
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Scheme Compliance Monitor</h1>
        <p class="subtitle">Visa | Mastercard | STAR Network | Principal Members | Impact Assessment</p>
      </div>

      <div class="input-card">
        <h2>Search Scheme Rules</h2>
        <div class="input-row">
          <input [(ngModel)]="displayQuery" placeholder="e.g. Latest Visa scheme rule changes affecting B4B 2026" (keyup.enter)="searchFreeText()" />
          <button (click)="searchFreeText()" [disabled]="loading || !displayQuery">{{ loading ? '...' : 'Search' }}</button>
        </div>
      </div>

      <div class="quick-section">
        <h2>Quick Scheme Check</h2>
        <div class="scheme-buttons">
          <button (click)="quickSearch('Visa Rules', 'Visa')" class="btn-scheme visa">💳 Visa Rules</button>
          <button (click)="quickSearch('Mastercard Rules', 'Mastercard')" class="btn-scheme mastercard">💳 Mastercard Rules</button>
          <button (click)="quickSearch('STAR Network', 'STAR Network')" class="btn-scheme star">⭐ STAR Network</button>
          <button (click)="quickSearch('Banking Circle', 'Banking Circle')" class="btn-scheme banking">🏦 Banking Circle</button>
          <button (click)="quickSearch('Thredd', 'Thredd')" class="btn-scheme thredd">🔗 Thredd</button>
          <button (click)="fullAssessment()" class="btn-scheme all">📋 Full Impact Assessment</button>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <span>Searching scheme rules and generating compliance assessment...</span>
      </div>

      <div *ngIf="error" class="error-bar">⚠ {{ error }}</div>

      <!-- Structured card -->
      <div *ngIf="parsed" class="result-card" [class]="'border-' + parsed.severity?.toLowerCase()">
        <div class="card-header">
          <div class="header-left">
            <span class="scheme-badge">{{ parsed.scheme }}</span>
            <span class="alert-type">{{ parsed.alert_type }}</span>
            <span *ngIf="parsed.rule_reference && parsed.rule_reference !== 'N/A'" class="rule-ref">{{ parsed.rule_reference }}</span>
          </div>
          <span [class]="'severity-badge sev-' + parsed.severity?.toLowerCase()">{{ parsed.severity?.toUpperCase() }}</span>
        </div>

        <p class="summary">{{ parsed.summary }}</p>

        <div class="fields-grid">
          <div class="field-item" *ngIf="parsed.effective_date">
            <span class="field-label">Effective Date</span>
            <span class="field-value deadline">{{ parsed.effective_date }}</span>
          </div>
          <div class="field-item" *ngIf="parsed.implementation_effort">
            <span class="field-label">Implementation Effort</span>
            <span class="field-value" [class]="'effort-' + parsed.implementation_effort?.toLowerCase()">{{ parsed.implementation_effort | uppercase }}</span>
          </div>
          <div class="field-item" *ngIf="parsed.accountability">
            <span class="field-label">Accountability</span>
            <span class="field-value">{{ parsed.accountability }}</span>
          </div>
          <div class="field-item" *ngIf="parsed.confidence_score">
            <span class="field-label">Confidence</span>
            <span class="field-value">{{ (parsed.confidence_score * 100).toFixed(0) }}%</span>
          </div>
        </div>

        <div *ngIf="parsed.affected_products?.length" class="tag-row">
          <span class="tag-label">Affected Products:</span>
          <span *ngFor="let p of parsed.affected_products" class="tag">{{ p }}</span>
        </div>

        <div *ngIf="parsed.compliance_gap" class="assessment-box gap">
          <span class="box-label">Compliance Gap</span>
          <p>{{ parsed.compliance_gap }}</p>
        </div>
        <div *ngIf="parsed.implementation_required" class="assessment-box impl">
          <span class="box-label">Implementation Required</span>
          <p>{{ parsed.implementation_required }}</p>
        </div>
        <div *ngIf="parsed.risk_of_non_compliance" class="assessment-box risk">
          <span class="box-label">Risk of Non-Compliance</span>
          <p>{{ parsed.risk_of_non_compliance }}</p>
        </div>

        <div *ngIf="parsed.recommended_action" class="action-box">
          <span class="action-label">Recommended Action</span>
          <p>{{ parsed.recommended_action }}</p>
        </div>

        <div *ngIf="parsed.notify?.length" class="tag-row">
          <span class="tag-label">Notify:</span>
          <span *ngFor="let n of parsed.notify" class="tag tag-notify">{{ n }}</span>
        </div>

        <div class="card-footer">
          <a *ngIf="isUrl(parsed.source_reference)" [href]="parsed.source_reference" target="_blank" class="source-link">Source ↗</a>
          <span *ngIf="!isUrl(parsed.source_reference)" class="source-text">{{ parsed.source_reference }}</span>
        </div>
      </div>

      <!-- Plain text fallback -->
      <div *ngIf="response && !parsed" class="response-card">
        <pre class="response-body">{{ response }}</pre>
      </div>

      <!-- History -->
      <div *ngIf="alerts.length > 1" class="history">
        <h2>Previous Alerts ({{ alerts.length - 1 }})</h2>
        <div *ngFor="let a of alerts.slice(1)" class="history-item" [class]="'hist-' + a.severity?.toLowerCase()" (click)="viewAlert(a)">
          <span class="hist-scheme">{{ a.scheme }}</span>
          <span class="hist-type">{{ a.alert_type }}</span>
          <span [class]="'hist-sev sev-' + a.severity?.toLowerCase()">{{ a.severity }}</span>
          <span class="hist-date">{{ a.effective_date }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; }
    .page-header { margin-bottom: 20px; }
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
    input:focus { border-color: var(--yellow); outline: none; }
    button {
      background: var(--yellow); color: #1a1a1a; border: none; padding: 11px 20px;
      border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: background 0.2s;
    }
    button:hover { background: var(--yellow-dark); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    .quick-section {
      background: var(--app-surface); border-radius: 10px; padding: 22px; margin-bottom: 16px;
      border: 1px solid var(--app-border);
    }
    .scheme-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
    .btn-scheme {
      padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 13px;
      border: 1px solid var(--app-btn-outline-border); background: var(--app-main-bg);
      font-weight: 600; transition: all 0.2s; color: var(--app-btn-outline-text);
    }
    .btn-scheme:hover { background: var(--app-btn-outline-hover-bg); border-color: var(--yellow); color: var(--yellow); }
    .all { background: var(--yellow); color: #1a1a1a; border-color: var(--yellow); }
    .all:hover { background: var(--yellow-dark); border-color: var(--yellow-dark); color: #1a1a1a; }

    .loading { display: flex; align-items: center; gap: 12px; padding: 20px; color: var(--app-text-muted); font-size: 13px; }
    .spinner {
      width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.08);
      border-top-color: var(--yellow); border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-bar { background: rgba(220,38,38,0.08); color: #f87171; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; }

    .result-card {
      background: var(--app-surface); border-radius: 12px; padding: 24px; margin-bottom: 16px;
      border: 1px solid var(--app-border); border-left: 4px solid rgba(255,255,255,0.08);
    }
    .border-critical { border-left-color: #dc2626; }
    .border-high { border-left-color: #ea580c; }
    .border-medium { border-left-color: #d97706; }
    .border-low { border-left-color: #16a34a; }

    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .header-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .scheme-badge { background: var(--yellow); color: #1a1a1a; padding: 5px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; }
    .alert-type { color: var(--app-text-muted); font-size: 12px; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; }
    .rule-ref { color: var(--yellow); font-size: 12px; font-weight: 600; }
    .severity-badge { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; }
    .sev-critical { background: rgba(220,38,38,0.15); color: #f87171; }
    .sev-high { background: rgba(234,88,12,0.15); color: #fb923c; }
    .sev-medium { background: rgba(217,119,6,0.15); color: #fbbf24; }
    .sev-low { background: rgba(22,163,74,0.15); color: #4ade80; }

    .summary { font-size: 14px; color: var(--app-text); line-height: 1.7; margin: 0 0 20px; }

    .fields-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .field-item { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px; border: 1px solid var(--app-border); }
    .field-label { display: block; font-size: 11px; color: var(--app-text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.3px; }
    .field-value { font-size: 14px; color: var(--app-text); font-weight: 600; }
    .deadline { color: #f87171; }
    .effort-low { color: #4ade80; }
    .effort-medium { color: #fbbf24; }
    .effort-high { color: #f87171; }

    .tag-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .tag-label { font-size: 12px; color: var(--app-text-muted); font-weight: 600; }
    .tag { background: rgba(245,192,16,0.12); color: var(--yellow); padding: 3px 12px; border-radius: 12px; font-size: 12px; }
    .tag-notify { background: rgba(220,38,38,0.12); color: #f87171; }

    .assessment-box { border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .assessment-box p { font-size: 13px; color: var(--app-text); line-height: 1.6; margin: 0; }
    .box-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
    .gap { background: rgba(217,119,6,0.08); border-left: 3px solid #d97706; }
    .gap .box-label { color: #fbbf24; }
    .impl { background: rgba(37,99,235,0.08); border-left: 3px solid #3b82f6; }
    .impl .box-label { color: #60a5fa; }
    .risk { background: rgba(220,38,38,0.08); border-left: 3px solid #dc2626; }
    .risk .box-label { color: #f87171; }

    .action-box {
      background: rgba(22,163,74,0.08); border-left: 3px solid #16a34a;
      border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 12px;
    }
    .action-label { display: block; font-size: 11px; color: #4ade80; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; letter-spacing: 0.5px; }
    .action-box p { font-size: 13px; color: var(--app-text); line-height: 1.7; margin: 0; }

    .card-footer { display: flex; align-items: center; margin-top: 12px; }
    .source-link { color: var(--yellow); font-size: 12px; text-decoration: none; }
    .source-link:hover { text-decoration: underline; }
    .source-text { font-size: 12px; color: var(--app-text-muted); }

    .response-card {
      background: var(--app-surface); border-radius: 10px; padding: 22px;
      border: 1px solid var(--app-border);
    }
    .response-body { white-space: pre-wrap; font-family: 'Segoe UI', Arial; font-size: 13px; color: var(--app-text); line-height: 1.7; margin: 0; }

    .history { margin-top: 20px; }
    .history h2 { font-size: 15px; color: var(--app-heading); margin-bottom: 10px; }
    .history-item {
      background: var(--app-surface); border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;
      display: flex; align-items: center; gap: 12px; cursor: pointer;
      border: 1px solid var(--app-border);
      border-left: 3px solid rgba(255,255,255,0.08); transition: all 0.2s;
    }
    .history-item:hover { border-color: rgba(245,192,16,0.2); }
    .hist-critical { border-left-color: #dc2626; }
    .hist-high { border-left-color: #ea580c; }
    .hist-medium { border-left-color: #d97706; }
    .hist-scheme { font-weight: 700; color: var(--yellow); font-size: 13px; min-width: 100px; }
    .hist-type { color: var(--app-text-muted); font-size: 12px; flex: 1; }
    .hist-sev { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
    .hist-date { font-size: 12px; color: var(--app-text-muted); min-width: 90px; text-align: right; }
  `]
})
export class SchemeComplianceComponent {
  displayQuery = '';
  response = '';
  parsed: any = null;
  alerts: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private lyzr: LyzrAgentService) {}

  private runSearch(apiPrompt: string) {
    this.loading = true;
    this.error = null;
    this.parsed = null;
    this.response = '';
    this.lyzr.callAgent(environment.agents['schemeCompliance'], apiPrompt).subscribe({
      next: (res) => {
        const p = this.lyzr.parseJSON<any>(res);
        if (p) {
          this.parsed = p;
          this.alerts = [p, ...this.alerts];
        } else {
          this.response = res.response;
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Unable to reach Scheme Compliance Agent. Please try again.';
        this.loading = false;
      }
    });
  }

  searchFreeText() {
    if (!this.displayQuery.trim()) return;
    this.runSearch(`${this.displayQuery}. Return Scheme_Compliance_Alert JSON.`);
  }

  quickSearch(label: string, scheme: string) {
    this.displayQuery = label;
    this.runSearch(`Find latest ${scheme} scheme rule changes and compliance updates in 2026 affecting B4B Payments card programmes. Return Scheme_Compliance_Alert JSON.`);
  }

  fullAssessment() {
    this.displayQuery = 'Full Impact Assessment';
    this.runSearch(`Generate a full scheme compliance impact assessment for B4B Payments covering Visa, Mastercard, and STAR Network rule changes in 2026. Return Scheme_Compliance_Alert JSON.`);
  }

  viewAlert(alert: any) {
    this.parsed = alert;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isUrl(s: string): boolean {
    return s?.startsWith('http');
  }
}
