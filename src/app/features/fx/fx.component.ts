import { Component } from '@angular/core';
import { LyzrAgentService } from '../../core/services/lyzr-agent.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fx',
  template: `
    <div class="page">
      <div class="page-header">
        <h1>FX Pricing Monitor</h1>
        <p class="subtitle">Monitor HSBC FX spreads and market competitiveness</p>
      </div>
      <div class="input-card">
        <h2>Check FX Rate</h2>
        <div class="input-row">
          <input [(ngModel)]="pair" placeholder="Currency pair e.g. GBP/USD" />
          <input [(ngModel)]="quotedRate" placeholder="HSBC quoted rate e.g. 1.2618" />
          <button (click)="check()" [disabled]="loading || !pair">{{ loading ? '...' : 'Check' }}</button>
        </div>
      </div>
      <div class="quick-buttons">
        <button *ngFor="let p of pairs" (click)="quickCheck(p)" class="btn-pair">{{ p }}</button>
      </div>
      <div *ngIf="loading" class="loading"><div class="spinner"></div> Fetching live rate data...</div>
      <div *ngIf="error" class="error-bar">⚠ {{ error }}</div>

      <!-- Structured card when JSON parsed -->
      <div *ngIf="parsed" class="fx-card" [class]="'impact-border-' + parsed.impact_level">
        <div class="fx-header">
          <div class="fx-meta">
            <span class="pair-badge">{{ parsed.currency_pair }}</span>
            <span class="meta-tag">{{ parsed.bank_name || 'HSBC' }}</span>
            <span *ngIf="parsed.data_source" class="meta-tag">{{ parsed.data_source }}</span>
          </div>
          <div class="badges">
            <span class="badge" [class]="'impact-' + parsed.impact_level">{{ parsed.impact_level | uppercase }}</span>
            <span *ngIf="parsed.competitiveness" class="badge comp" [class]="'comp-' + parsed.competitiveness?.toLowerCase()">{{ parsed.competitiveness }}</span>
          </div>
        </div>

        <div class="rate-grid">
          <div class="rate-box">
            <span class="rate-label">HSBC Quoted</span>
            <span class="rate-value">{{ parsed.hsbc_rate || parsed.quoted_rate }}</span>
          </div>
          <div class="rate-box">
            <span class="rate-label">Market Mid Rate</span>
            <span class="rate-value">{{ parsed.market_rate || parsed.mid_rate }}</span>
          </div>
          <div *ngIf="parsed.spread_percentage || parsed.spread_pct" class="rate-box">
            <span class="rate-label">Spread</span>
            <span class="rate-value spread">{{ parsed.spread_percentage || parsed.spread_pct }}%</span>
          </div>
          <div *ngIf="parsed.confidence_score" class="rate-box">
            <span class="rate-label">Confidence</span>
            <span class="rate-value">{{ (parsed.confidence_score * 100).toFixed(0) }}%</span>
          </div>
        </div>

        <p *ngIf="parsed.summary" class="summary">{{ parsed.summary }}</p>

        <div *ngIf="parsed.recommended_action" class="action-box">
          <span class="action-label">Recommended Action</span>
          <p class="action-text">{{ parsed.recommended_action }}</p>
        </div>

        <div *ngIf="parsed.notify?.length" class="tag-row">
          <span class="tag-label">Notify:</span>
          <span *ngFor="let n of parsed.notify" class="tag">{{ n }}</span>
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
      border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
      transition: background 0.2s;
    }
    button:hover { background: var(--yellow-dark); }
    button:disabled { opacity: 0.5; }
    .quick-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .btn-pair {
      background: var(--app-main-bg); border: 1px solid var(--app-btn-outline-border); padding: 9px 16px;
      border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--app-btn-outline-text); transition: all 0.2s;
    }
    .btn-pair:hover { background: var(--app-btn-outline-hover-bg); border-color: var(--yellow); color: var(--yellow); }
    .loading { display: flex; align-items: center; gap: 10px; padding: 16px; color: var(--app-text-muted); }
    .spinner {
      width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.08);
      border-top-color: var(--yellow); border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-bar { background: rgba(220,38,38,0.08); color: #f87171; padding: 12px; border-radius: 8px; font-size: 13px; }

    .fx-card {
      background: var(--app-surface); border-radius: 12px; padding: 24px;
      border: 1px solid var(--app-border); border-left: 4px solid #6b7280;
    }
    .impact-border-critical { border-left-color: #dc2626; }
    .impact-border-high { border-left-color: #ea580c; }
    .impact-border-medium { border-left-color: #d97706; }
    .impact-border-low { border-left-color: #16a34a; }

    .fx-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
    .fx-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .pair-badge { background: var(--yellow); color: #1a1a1a; padding: 5px 14px; border-radius: 6px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
    .meta-tag { color: var(--app-text-muted); font-size: 12px; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; }
    .badges { display: flex; gap: 6px; align-items: center; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .impact-critical { background: rgba(220,38,38,0.15); color: #f87171; }
    .impact-high { background: rgba(234,88,12,0.15); color: #fb923c; }
    .impact-medium { background: rgba(217,119,6,0.15); color: #fbbf24; }
    .impact-low { background: rgba(22,163,74,0.15); color: #4ade80; }
    .comp { background: rgba(245,192,16,0.12); color: var(--yellow); }

    .rate-grid { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .rate-box {
      background: rgba(255,255,255,0.03); border-radius: 10px; padding: 16px 22px;
      min-width: 110px; text-align: center; border: 1px solid var(--app-border);
    }
    .rate-label { display: block; font-size: 11px; color: var(--app-text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 6px; letter-spacing: 0.3px; }
    .rate-value { display: block; font-size: 22px; font-weight: 700; color: var(--yellow); }
    .spread { color: #fbbf24; }

    .summary { font-size: 14px; color: var(--app-text); line-height: 1.7; margin: 0 0 16px; }
    .action-box {
      background: rgba(245,192,16,0.06); border-left: 3px solid var(--yellow);
      border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 14px;
    }
    .action-label { font-size: 11px; color: var(--yellow); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px; letter-spacing: 0.5px; }
    .action-text { font-size: 13px; color: var(--app-text); line-height: 1.7; margin: 0; }
    .tag-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .tag-label { font-size: 12px; color: var(--app-text-muted); font-weight: 600; }
    .tag { background: rgba(245,192,16,0.12); color: var(--yellow); padding: 3px 12px; border-radius: 12px; font-size: 12px; }

    .response-card {
      background: var(--app-surface); border-radius: 10px; padding: 22px;
      border: 1px solid var(--app-border);
    }
    .response-body { white-space: pre-wrap; font-family: 'Segoe UI', Arial; font-size: 13px; color: var(--app-text); line-height: 1.7; margin: 0; }
  `]
})
export class FxComponent {
  pair = ''; quotedRate = ''; response = ''; parsed: any = null; loading = false; error: string | null = null;
  pairs = ['GBP/USD', 'GBP/EUR', 'EUR/USD', 'GBP/CHF', 'GBP/JPY'];
  constructor(private lyzr: LyzrAgentService) {}
  check() {
    this.loading = true;
    this.error = null;
    this.parsed = null;
    this.response = '';
    const msg = this.quotedRate
      ? `The HSBC quoted ${this.pair} rate is ${this.quotedRate}. Search for current ${this.pair.replace('/', ' to ')} market mid rate today. Calculate spread percentage. Classify competitiveness. Return FX_Pricing_Alert JSON.`
      : `Search for current ${this.pair.replace('/', ' to ')} exchange rate today and assess HSBC FX competitiveness.`;
    this.lyzr.callAgent(environment.agents['fx'], msg).subscribe({
      next: (res) => {
        this.parsed = this.lyzr.parseJSON<any>(res);
        if (!this.parsed) this.response = res.response;
        this.loading = false;
      },
      error: (err: any) => { this.error = err.message || 'Unable to fetch FX data. Please try again.'; this.loading = false; }
    });
  }
  quickCheck(p: string) {
    const defaultRates: Record<string, string> = {
      'GBP/USD': '1.2618',
      'GBP/EUR': '1.1685',
      'EUR/USD': '1.0756',
      'GBP/CHF': '1.1283',
      'GBP/JPY': '191.62'
    };
    this.pair = p;
    this.quotedRate = defaultRates[p] || '';
    this.check();
  }
}
