import { Component, OnInit } from '@angular/core';
import { LyzrAgentService } from '../../core/services/lyzr-agent.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Intelligence Dashboard</h1>
          <p class="subtitle">Art Intelligence Platform | Powered by Lyzr AI</p>
        </div>
        <button (click)="loadBriefing()" class="btn-primary" [disabled]="loading">
          {{ loading ? 'Loading...' : '↻ Morning Briefing' }}
        </button>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat" [class.stat-danger]="criticalCount > 0">
          <span class="stat-num">{{ criticalCount }}</span>
          <span class="stat-label">Critical</span>
        </div>
        <div class="stat" [class.stat-warn]="highCount > 0">
          <span class="stat-num">{{ highCount }}</span>
          <span class="stat-label">High</span>
        </div>
        <div class="stat">
          <span class="stat-num">{{ alerts.length }}</span>
          <span class="stat-label">Total Alerts</span>
        </div>
        <div class="stat">
          <span class="stat-num">6</span>
          <span class="stat-label">Agents Active</span>
        </div>
      </div>

      <!-- Quick Ask Manager -->
      <div class="ask-section">
        <h2>Ask the Intelligence Platform</h2>
        <div class="ask-bar">
          <input [(ngModel)]="userQuery" placeholder="Ask anything — e.g. 'Any HSBC rate changes?' or 'Check GBP/USD spread'" (keyup.enter)="askManager()" />
          <button (click)="askManager()" [disabled]="asking || !userQuery">
            {{ asking ? 'Thinking...' : 'Ask →' }}
          </button>
        </div>
        <div *ngIf="managerResponse" class="manager-response">
          <div class="response-label">Manager Agent Response</div>
          <div class="response-body">{{ managerResponse }}</div>
        </div>
      </div>

      <!-- Quick Bank Buttons -->
      <div class="quick-section">
        <h2>Quick Bank Check</h2>
        <div class="bank-buttons">
          <button *ngFor="let bank of banks"
            (click)="checkBank(bank)"
            [disabled]="!!loadingBank"
            [class.btn-bank-loading]="loadingBank === bank"
            class="btn-bank">
            <span *ngIf="loadingBank === bank" class="btn-spinner"></span>
            {{ loadingBank === bank ? 'Checking ' + bank + '...' : bank }}
          </button>
        </div>
      </div>

      <!-- Bank loading progress bar -->
      <div *ngIf="loadingBank" class="bank-progress">
        <div class="bank-progress-bar"></div>
        <span>Fetching {{ loadingBank }} rate data...</span>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="error-bar">
        ⚠ {{ error }} <button (click)="error = null">✕</button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-bar">
        <div class="spinner"></div> Loading intelligence...
      </div>

      <!-- Alerts Feed -->
      <div class="alerts-section">
        <div class="section-header">
          <h2>Live Alerts</h2>
          <span class="badge-count">{{ alerts.length }}</span>
        </div>
        <app-alert-card *ngFor="let a of alerts" [alert]="a"></app-alert-card>
        <div *ngIf="alerts.length === 0 && !loading && !loadingBank" class="empty">
          Click "Morning Briefing" or search a bank to load alerts.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    h1 { font-size: 24px; color: var(--app-heading); margin: 0 0 4px; }
    .subtitle { color: var(--app-text-muted); font-size: 13px; margin: 0; }
    .btn-primary {
      background: var(--yellow); color: #1a1a1a; border: none; padding: 10px 22px;
      border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
      transition: background 0.2s, transform 0.15s;
    }
    .btn-primary:hover { background: var(--yellow-dark); transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .stats-bar { display: flex; gap: 14px; margin-bottom: 24px; }
    .stat {
      flex: 1; background: var(--app-surface); border-radius: 10px; padding: 20px 24px; text-align: center;
      border: 1px solid var(--app-border);
    }
    .stat-num { display: block; font-size: 30px; font-weight: 700; color: var(--yellow); }
    .stat-label { display: block; font-size: 11px; color: var(--app-text-muted); margin-top: 6px; letter-spacing: 0.5px; text-transform: uppercase; }
    .stat-danger .stat-num { color: #dc2626; }
    .stat-warn .stat-num { color: #ea580c; }

    .ask-section {
      background: var(--app-surface); border-radius: 10px; padding: 22px;
      margin-bottom: 20px; border: 1px solid var(--app-border);
    }
    .ask-section h2 { font-size: 15px; color: var(--app-heading); margin: 0 0 14px; }
    .ask-bar { display: flex; gap: 10px; }
    .ask-bar input {
      flex: 1; padding: 11px 14px; border: 1px solid var(--app-input-border);
      border-radius: 8px; font-size: 14px; background: var(--app-main-bg); color: var(--app-text);
    }
    .ask-bar button {
      background: var(--yellow); color: #1a1a1a; border: none; padding: 11px 22px;
      border-radius: 8px; cursor: pointer; font-size: 14px; white-space: nowrap; font-weight: 600;
      transition: background 0.2s;
    }
    .ask-bar button:hover { background: var(--yellow-dark); }
    .ask-bar button:disabled { opacity: 0.5; cursor: not-allowed; }
    .manager-response {
      margin-top: 14px; background: rgba(255,255,255,0.03); border-radius: 8px;
      padding: 16px; border-left: 3px solid var(--app-border);
    }
    .response-label { font-size: 11px; color: var(--app-text-muted); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .response-body { font-size: 13px; color: var(--app-text); white-space: pre-wrap; line-height: 1.7; }

    .quick-section {
      background: var(--app-surface); border-radius: 10px; padding: 22px;
      margin-bottom: 20px; border: 1px solid var(--app-border);
    }
    .quick-section h2 { font-size: 15px; color: var(--app-heading); margin: 0 0 14px; }
    .bank-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
    .btn-bank {
      background: var(--app-main-bg); border: 1px solid var(--app-btn-outline-border); padding: 9px 18px;
      border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--app-btn-outline-text);
      font-weight: 500; transition: all 0.2s;
    }
    .btn-bank:hover { background: var(--app-btn-outline-hover-bg); border-color: var(--yellow); color: var(--yellow); }
    .btn-bank:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-bank-loading {
      background: var(--app-btn-outline-hover-bg) !important; border-color: var(--yellow) !important;
      color: var(--yellow) !important; display: flex; align-items: center; gap: 6px;
    }
    .btn-spinner {
      width: 10px; height: 10px; border: 2px solid rgba(245,192,16,0.3);
      border-top-color: var(--yellow); border-radius: 50%; animation: spin 0.7s linear infinite;
      display: inline-block; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .bank-progress {
      display: flex; align-items: center; gap: 12px; padding: 10px 16px;
      background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 12px;
      font-size: 13px; color: var(--app-text-muted); overflow: hidden; position: relative;
    }
    .bank-progress-bar {
      position: absolute; left: 0; top: 0; height: 3px;
      background: linear-gradient(90deg, var(--yellow), var(--yellow-dark), var(--yellow));
      background-size: 200% 100%; animation: progress 1.5s ease-in-out infinite; width: 100%;
    }
    @keyframes progress { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .error-bar {
      background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.25); color: #f87171;
      padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; display: flex;
      justify-content: space-between; align-items: center; font-size: 13px;
    }
    .error-bar button { background: none; border: none; cursor: pointer; color: #f87171; font-size: 16px; }

    .loading-bar { display: flex; align-items: center; gap: 12px; padding: 20px; color: var(--app-text-muted); font-size: 14px; }
    .spinner {
      width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.08);
      border-top-color: var(--yellow); border-radius: 50%; animation: spin 0.8s linear infinite;
    }

    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .section-header h2 { font-size: 15px; color: var(--app-heading); margin: 0; }
    .badge-count {
      background: var(--app-main-bg); color: var(--app-text-muted); font-size: 12px;
      padding: 2px 10px; border-radius: 10px; font-weight: 600;
    }
    .empty {
      background: var(--app-surface); border-radius: 10px; padding: 40px; text-align: center;
      color: var(--app-text-muted); font-size: 13px; border: 1px solid var(--app-border);
    }
  `]
})
export class DashboardComponent implements OnInit {
  alerts: any[] = [];
  loading = false;
  asking = false;
  loadingBank = '';
  error: string | null = null;
  userQuery = '';
  managerResponse = '';

  banks = ['HSBC', 'Barclays', 'NatWest', 'Lloyds', 'Santander', 'Halifax'];

  get criticalCount() { return this.alerts.filter(a => (a.impact_level || a.severity) === 'critical').length; }
  get highCount() { return this.alerts.filter(a => (a.impact_level || a.severity) === 'high').length; }

  constructor(private lyzr: LyzrAgentService) {}

  ngOnInit() {}

  loadBriefing() {
    this.loading = true;
    this.error = null;
    this.lyzr.callAgent(
      environment.agents['monitor'],
      'Compare all rate sheets. Detect all changes. Return Bank_Event_Notification JSON.',
      `morning-${new Date().toDateString()}`
    ).subscribe({
      next: (res) => {
        const parsed = this.lyzr.parseJSON<any>(res);
        if (parsed) {
          this.alerts = [parsed, ...this.alerts];
        } else {
          this.alerts = [{
            bank_name: 'Morning Briefing',
            summary: res.response,
            impact_level: 'medium',
            event_type: 'briefing',
            recommended_action: '',
            confidence_score: 0.9
          }, ...this.alerts];
        }
        this.loading = false;
      },
      error: (err: any) => { this.error = err.message || 'Unable to load morning briefing. Please try again.'; this.loading = false; }
    });
  }

  checkBank(bank: string) {
    this.loadingBank = bank;
    this.lyzr.callAgent(
      environment.agents['monitor'],
      `Search for latest ${bank} UK rate changes in 2026. Return Bank_Event_Notification JSON.`
    ).subscribe({
      next: (res) => {
        const parsed = this.lyzr.parseJSON<any>(res);
        if (parsed) {
          this.alerts = [parsed, ...this.alerts];
        } else {
          this.alerts = [{
            bank_name: bank,
            summary: res.response,
            impact_level: 'low',
            event_type: 'rate changes',
            recommended_action: '',
            confidence_score: 0.8
          }, ...this.alerts];
        }
        this.loadingBank = '';
        setTimeout(() => document.querySelector('.alerts-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      error: (err: any) => {
        this.alerts = [{
          bank_name: bank,
          summary: err.message || 'Unable to fetch rate data. Please try again.',
          impact_level: 'low',
          event_type: 'error',
          recommended_action: '',
          confidence_score: 0
        }, ...this.alerts];
        this.loadingBank = '';
        setTimeout(() => document.querySelector('.alerts-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    });
  }

  askManager() {
    if (!this.userQuery.trim()) return;
    this.asking = true;
    this.managerResponse = '';
    this.lyzr.callManager(this.userQuery).subscribe({
      next: (res) => {
        this.managerResponse = res.response;
        this.asking = false;
      },
      error: () => {
        this.managerResponse = 'Unable to get a response right now. Please try again.';
        this.asking = false;
      }
    });
  }
}
