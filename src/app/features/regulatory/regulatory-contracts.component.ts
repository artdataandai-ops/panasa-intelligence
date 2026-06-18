import { Component } from '@angular/core';
import { LyzrAgentService } from '../../core/services/lyzr-agent.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-regulatory',
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Regulatory Monitor</h1>
        <p class="subtitle">FCA EMI | PCI-DSS | EU PSD3 | US Durbin | Multi-jurisdictional compliance</p>
      </div>
      <div class="input-card">
        <div class="input-row">
          <input [(ngModel)]="displayQuery" placeholder="Ask about regulations e.g. 'Latest FCA EMI updates 2026'" (keyup.enter)="searchFreeText()" />
          <button (click)="searchFreeText()" [disabled]="loading || !displayQuery">{{ loading ? '...' : 'Search' }}</button>
        </div>
      </div>
      <div class="quick-buttons">
        <button (click)="quickSearch('FCA EMI 2026', 'FCA Electronic Money Institution')" class="btn-q">FCA EMI 2026</button>
        <button (click)="quickSearch('PCI-DSS', 'PCI-DSS card issuer')" class="btn-q">PCI-DSS</button>
        <button (click)="quickSearch('EU PSD3', 'EU PSD3 prepaid card')" class="btn-q">EU PSD3</button>
        <button (click)="quickSearch('US Durbin', 'US Durbin prepaid debit')" class="btn-q">US Durbin</button>
      </div>
      <div *ngIf="loading" class="loading"><div class="spinner"></div> Searching regulatory updates...</div>
      <div *ngIf="error" class="error-bar">⚠ {{ error }}</div>

      <!-- Structured card when JSON parsed -->
      <div *ngIf="parsed" class="reg-card">
        <div class="reg-card-header">
          <div class="reg-meta">
            <span class="regulator-badge">{{ parsed.regulator }}</span>
            <span class="jurisdiction">{{ parsed.jurisdiction }}</span>
            <span class="event-type">{{ parsed.event_type }}</span>
          </div>
          <div class="badges">
            <span class="badge impact" [class]="'impact-' + parsed.impact_level">{{ parsed.impact_level | uppercase }}</span>
            <span class="badge urgency" [class]="'urgency-' + parsed.urgency">{{ parsed.urgency | uppercase }}</span>
          </div>
        </div>

        <p class="summary">{{ parsed.summary }}</p>

        <div class="reg-grid">
          <div *ngIf="parsed.compliance_deadline" class="reg-field">
            <span class="field-label">Compliance Deadline</span>
            <span class="field-value deadline">{{ parsed.compliance_deadline }}</span>
          </div>
          <div *ngIf="parsed.source_reference" class="reg-field">
            <span class="field-label">Source</span>
            <a *ngIf="parsed.source_reference.startsWith('http')" [href]="parsed.source_reference" target="_blank" class="field-link">{{ parsed.source_reference }}</a>
            <span *ngIf="!parsed.source_reference.startsWith('http')" class="field-value">{{ parsed.source_reference }}</span>
          </div>
          <div *ngIf="parsed.confidence_score" class="reg-field">
            <span class="field-label">Confidence</span>
            <span class="field-value">{{ (parsed.confidence_score * 100).toFixed(0) }}%</span>
          </div>
        </div>

        <div *ngIf="parsed.affected_products?.length" class="tag-row">
          <span class="tag-label">Affected Products:</span>
          <span *ngFor="let p of parsed.affected_products" class="tag">{{ p }}</span>
        </div>

        <div *ngIf="parsed.recommended_action" class="action-box">
          <span class="action-label">Recommended Action</span>
          <p class="action-text">{{ parsed.recommended_action }}</p>
        </div>

        <div *ngIf="parsed.notify?.length" class="tag-row">
          <span class="tag-label">Notify:</span>
          <span *ngFor="let n of parsed.notify" class="tag tag-notify">{{ n }}</span>
        </div>
      </div>

      <!-- Plain text fallback -->
      <div *ngIf="response && !parsed" class="response-card">
        <pre class="response-body">{{ response }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; }
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; color: var(--app-heading); margin: 0 0 4px; }
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
    button:disabled { opacity: 0.5; }
    .quick-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .btn-q {
      background: var(--app-main-bg); border: 1px solid var(--app-btn-outline-border); padding: 9px 16px;
      border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--app-btn-outline-text); transition: all 0.2s;
    }
    .btn-q:hover { background: var(--app-btn-outline-hover-bg); border-color: var(--yellow); color: var(--yellow); }
    .loading { display: flex; align-items: center; padding: 16px; color: var(--app-text-muted); gap: 10px; }
    .spinner {
      width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.08);
      border-top-color: var(--yellow); border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-bar { background: rgba(220,38,38,0.08); color: #f87171; padding: 12px; border-radius: 8px; font-size: 13px; }

    .reg-card {
      background: var(--app-surface); border-radius: 12px; padding: 24px;
      border: 1px solid var(--app-border); border-left: 4px solid var(--yellow);
    }
    .reg-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .reg-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .regulator-badge { background: var(--yellow); color: #1a1a1a; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; }
    .jurisdiction { color: var(--app-text-muted); font-size: 12px; }
    .event-type { color: var(--app-text-muted); font-size: 12px; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; }
    .badges { display: flex; gap: 6px; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .impact-critical { background: rgba(220,38,38,0.15); color: #f87171; }
    .impact-high { background: rgba(234,88,12,0.15); color: #fb923c; }
    .impact-medium { background: rgba(217,119,6,0.15); color: #fbbf24; }
    .impact-low { background: rgba(22,163,74,0.15); color: #4ade80; }
    .urgency-urgent { background: rgba(220,38,38,0.15); color: #f87171; }
    .urgency-high { background: rgba(234,88,12,0.15); color: #fb923c; }
    .urgency-medium { background: rgba(217,119,6,0.15); color: #fbbf24; }
    .urgency-low { background: rgba(22,163,74,0.15); color: #4ade80; }

    .summary { font-size: 14px; color: var(--app-text); line-height: 1.7; margin: 0 0 20px; }

    .reg-grid { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 16px; }
    .reg-field { display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 11px; color: var(--app-text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.3px; }
    .field-value { font-size: 13px; color: var(--app-text); font-weight: 500; }
    .field-link { font-size: 12px; color: var(--yellow); text-decoration: none; word-break: break-all; }
    .field-link:hover { text-decoration: underline; }
    .deadline { color: #f87171; font-weight: 700; }

    .tag-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .tag-label { font-size: 12px; color: var(--app-text-muted); font-weight: 600; }
    .tag { background: rgba(245,192,16,0.12); color: var(--yellow); padding: 3px 12px; border-radius: 12px; font-size: 12px; }
    .tag-notify { background: rgba(220,38,38,0.12); color: #f87171; }

    .action-box {
      background: rgba(245,192,16,0.06); border-left: 3px solid var(--yellow);
      border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 14px;
    }
    .action-label { font-size: 11px; color: var(--yellow); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px; letter-spacing: 0.5px; }
    .action-text { font-size: 13px; color: var(--app-text); line-height: 1.7; margin: 0; }

    .response-card {
      background: var(--app-surface); border-radius: 10px; padding: 22px;
      border: 1px solid var(--app-border);
    }
    .response-body { white-space: pre-wrap; font-family: 'Segoe UI', Arial; font-size: 13px; color: var(--app-text); line-height: 1.7; margin: 0; }
  `]
})
export class RegulatoryComponent {
  displayQuery = ''; response = ''; parsed: any = null; loading = false; error: string | null = null;
  constructor(private lyzr: LyzrAgentService) {}

  private runSearch(apiPrompt: string) {
    this.loading = true; this.error = null; this.parsed = null; this.response = '';
    this.lyzr.callAgent(environment.agents['regulatory'], apiPrompt).subscribe({
      next: (res) => {
        this.parsed = this.lyzr.parseJSON<any>(res);
        if (!this.parsed) this.response = res.response;
        this.loading = false;
      },
      error: (err: any) => { this.error = err.message || 'Unable to load regulatory data. Please try again.'; this.loading = false; }
    });
  }

  searchFreeText() {
    if (!this.displayQuery.trim()) return;
    this.runSearch(`${this.displayQuery}. Return Regulatory_Update JSON.`);
  }

  quickSearch(label: string, topic: string) {
    this.displayQuery = label;
    this.runSearch(`Find the latest ${topic} regulatory updates in 2026. Classify urgency. Return Regulatory_Update JSON.`);
  }
}

@Component({
  selector: 'app-contracts',
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Contract Review</h1>
        <p class="subtitle">Partner bank contract and T&amp;C change analysis</p>
      </div>
      <div class="input-card">
        <div class="input-row">
          <input [(ngModel)]="query" placeholder="Ask about contracts e.g. 'What changed in HSBC agreement v2?'" (keyup.enter)="search()" />
          <button (click)="search()" [disabled]="loading || !query">{{ loading ? '...' : 'Review' }}</button>
        </div>
      </div>
      <div class="quick-buttons">
        <button (click)="quickSearch('HSBC v1 vs v2 all changes')" class="btn-q">HSBC All Changes</button>
        <button (click)="quickSearch('HSBC exclusive rate clause 3.1')" class="btn-q">Exclusive Rate</button>
        <button (click)="quickSearch('HSBC liability cap clause 6.1')" class="btn-q">Liability Cap</button>
        <button (click)="quickSearch('Barclays T&C March 2026')" class="btn-q">Barclays T&amp;C</button>
        <button (click)="quickSearch('most critical contract changes requiring immediate action')" class="btn-q">Critical Changes</button>
      </div>
      <div *ngIf="loading" class="loading"><div class="spinner"></div> Reviewing contract changes...</div>
      <div *ngIf="error" class="error-bar">⚠ {{ error }}</div>

      <!-- Structured card when JSON parsed -->
      <div *ngIf="parsed" class="contract-card" [class]="'severity-border-' + parsed.severity">
        <div class="card-header">
          <div class="card-meta">
            <span class="bank-badge">{{ parsed.bank_name }}</span>
            <span class="meta-tag">{{ parsed.contract_type }}</span>
            <span class="meta-tag">{{ parsed.change_type }}</span>
          </div>
          <span class="badge" [class]="'severity-' + parsed.severity">{{ parsed.severity | uppercase }}</span>
        </div>

        <div *ngIf="parsed.affected_clause" class="clause-ref">
          <span class="clause-label">Clause:</span> {{ parsed.affected_clause }}
        </div>

        <p class="summary">{{ parsed.change_summary }}</p>

        <div *ngIf="parsed.commercial_impact" class="impact-box">
          <span class="impact-label">Commercial Impact</span>
          <p class="impact-text">{{ parsed.commercial_impact }}</p>
        </div>

        <div class="card-grid">
          <div *ngIf="parsed.route_to" class="card-field">
            <span class="field-label">Route To</span>
            <span class="field-value route-tag">{{ parsed.route_to }}</span>
          </div>
          <div class="card-field">
            <span class="field-label">Client Impact</span>
            <span class="field-value" [style.color]="parsed.client_impact ? '#dc2626' : '#16a34a'">
              {{ parsed.client_impact ? 'Yes' : 'No' }}
            </span>
          </div>
          <div *ngIf="parsed.confidence_score" class="card-field">
            <span class="field-label">Confidence</span>
            <span class="field-value">{{ (parsed.confidence_score * 100).toFixed(0) }}%</span>
          </div>
        </div>

        <div *ngIf="parsed.recommended_action" class="action-box">
          <span class="action-label">Recommended Action</span>
          <p class="action-text">{{ parsed.recommended_action }}</p>
        </div>

        <div *ngIf="parsed.source_reference" class="source-ref">
          <span class="field-label">Source:</span> {{ parsed.source_reference }}
        </div>
      </div>

      <!-- Plain text fallback -->
      <div *ngIf="response && !parsed" class="response-card">
        <pre class="response-body">{{ response }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; }
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; color: var(--app-heading); margin: 0 0 4px; }
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
    button:disabled { opacity: 0.5; }
    .quick-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .btn-q {
      background: var(--app-main-bg); border: 1px solid var(--app-btn-outline-border); padding: 9px 16px;
      border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--app-btn-outline-text); transition: all 0.2s;
    }
    .btn-q:hover { background: var(--app-btn-outline-hover-bg); border-color: var(--yellow); color: var(--yellow); }
    .loading { display: flex; align-items: center; padding: 16px; color: var(--app-text-muted); gap: 10px; }
    .spinner {
      width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.08);
      border-top-color: var(--yellow); border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-bar { background: rgba(220,38,38,0.08); color: #f87171; padding: 12px; border-radius: 8px; font-size: 13px; }

    .contract-card {
      background: var(--app-surface); border-radius: 12px; padding: 24px;
      border: 1px solid var(--app-border); border-left: 4px solid #6b7280;
    }
    .severity-border-critical { border-left-color: #dc2626; }
    .severity-border-high { border-left-color: #ea580c; }
    .severity-border-medium { border-left-color: #d97706; }
    .severity-border-low { border-left-color: #16a34a; }

    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
    .card-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .bank-badge { background: var(--yellow); color: #1a1a1a; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; }
    .meta-tag { color: var(--app-text-muted); font-size: 12px; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .severity-critical { background: rgba(220,38,38,0.15); color: #f87171; }
    .severity-high { background: rgba(234,88,12,0.15); color: #fb923c; }
    .severity-medium { background: rgba(217,119,6,0.15); color: #fbbf24; }
    .severity-low { background: rgba(22,163,74,0.15); color: #4ade80; }

    .clause-ref { font-size: 12px; color: var(--app-text-muted); margin-bottom: 12px; }
    .clause-label { font-weight: 600; color: var(--app-text); }
    .summary { font-size: 14px; color: var(--app-text); line-height: 1.7; margin: 0 0 16px; }

    .impact-box {
      background: rgba(217,119,6,0.08); border-left: 3px solid #d97706;
      border-radius: 0 8px 8px 0; padding: 14px 16px; margin-bottom: 16px;
    }
    .impact-label { font-size: 11px; color: #fbbf24; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px; letter-spacing: 0.5px; }
    .impact-text { font-size: 13px; color: var(--app-text); line-height: 1.6; margin: 0; }

    .card-grid { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 16px; }
    .card-field { display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 11px; color: var(--app-text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.3px; }
    .field-value { font-size: 13px; color: var(--app-text); font-weight: 500; }
    .route-tag { background: rgba(245,192,16,0.12); color: var(--yellow); padding: 2px 10px; border-radius: 10px; font-size: 12px; display: inline-block; }

    .action-box {
      background: rgba(245,192,16,0.06); border-left: 3px solid var(--yellow);
      border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 14px;
    }
    .action-label { font-size: 11px; color: var(--yellow); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px; letter-spacing: 0.5px; }
    .action-text { font-size: 13px; color: var(--app-text); line-height: 1.7; margin: 0; }

    .source-ref { font-size: 11px; color: var(--app-text-muted); margin-top: 8px; }

    .response-card {
      background: var(--app-surface); border-radius: 10px; padding: 22px;
      border: 1px solid var(--app-border);
    }
    .response-body { white-space: pre-wrap; font-family: 'Segoe UI', Arial; font-size: 13px; color: var(--app-text); line-height: 1.7; margin: 0; }
  `]
})
export class ContractsComponent {
  query = ''; response = ''; parsed: any = null; loading = false; error: string | null = null;
  constructor(private lyzr: LyzrAgentService) {}
  search() {
    this.loading = true; this.error = null; this.parsed = null; this.response = '';
    this.lyzr.callAgent(environment.agents['contracts'], this.query).subscribe({
      next: (res) => {
        this.parsed = this.lyzr.parseJSON<any>(res);
        if (!this.parsed) this.response = res.response;
        this.loading = false;
      },
      error: (err: any) => { this.error = err.message || 'Unable to load contract data. Please try again.'; this.loading = false; }
    });
  }
  quickSearch(q: string) { this.query = q; this.search(); }
}
