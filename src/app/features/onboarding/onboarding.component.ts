import { Component } from '@angular/core';
import { LyzrAgentService } from '../../core/services/lyzr-agent.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-onboarding',
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Institutional Onboarding</h1>
        <p class="subtitle">KYB verification, UBO identification, sanctions screening</p>
      </div>
      <div class="input-card">
        <h2>New Onboarding Case</h2>
        <div class="form-row">
          <input [(ngModel)]="entityName" placeholder="Entity name e.g. Alpha Capital Holdings Ltd" />
          <input [(ngModel)]="jurisdiction" placeholder="Jurisdiction e.g. Cayman Islands" />
        </div>
        <input [(ngModel)]="documents" placeholder="Documents provided (comma separated) e.g. Certificate of Incorporation, Register of Directors" style="width:100%;margin-bottom:12px;box-sizing:border-box;" />
        <button (click)="assess()" [disabled]="loading || !entityName">{{ loading ? 'Assessing...' : 'Assess Case' }}</button>
      </div>
      <div class="quick-tests">
        <h2>Quick Tests</h2>
        <button (click)="runTest('Alpha Capital Holdings Ltd', 'Cayman Islands', 'Certificate of Incorporation, Register of Directors')" class="btn-test">Alpha Capital (partial docs)</button>
        <button (click)="runTest('Barclays Bank PLC', 'United Kingdom', 'Full documentation provided')" class="btn-test">Barclays UK (Companies House)</button>
        <button (click)="runTest('Beta Fund Management Ltd', 'British Virgin Islands', 'Certificate of Incorporation only')" class="btn-test">Beta Fund BVI (high risk)</button>
      </div>
      <div *ngIf="loading" class="loading"><div class="spinner"></div> Assessing...</div>
      <div *ngIf="error" class="error-bar">{{ error }}</div>
      <div *ngIf="response" class="response-card">
        <div class="response-label">Onboarding Assessment</div>
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
    .form-row { display: flex; gap: 10px; margin-bottom: 12px; }
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
    .quick-tests {
      background: var(--app-surface); border-radius: 10px; padding: 22px; margin-bottom: 16px;
      display: flex; flex-wrap: wrap; gap: 8px;
      align-items: flex-start; border: 1px solid var(--app-border);
    }
    .btn-test {
      background: var(--app-main-bg); border: 1px solid var(--app-btn-outline-border); padding: 9px 16px;
      border-radius: 8px; cursor: pointer; font-size: 12px; color: var(--app-btn-outline-text); transition: all 0.2s;
    }
    .btn-test:hover { background: var(--app-btn-outline-hover-bg); border-color: var(--yellow); color: var(--yellow); }
    .loading { display: flex; align-items: center; gap: 10px; padding: 16px; color: var(--app-text-muted); }
    .spinner {
      width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.08);
      border-top-color: var(--yellow); border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-bar { background: rgba(220,38,38,0.08); color: #f87171; padding: 12px; border-radius: 8px; font-size: 13px; }
    .response-card {
      background: var(--app-surface); border-radius: 10px; padding: 22px;
      border: 1px solid var(--app-border);
    }
    .response-label { font-size: 11px; color: var(--app-text-muted); margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .response-body { white-space: pre-wrap; font-family: 'Segoe UI', Arial; font-size: 13px; color: var(--app-text); line-height: 1.7; margin: 0; }
  `]
})
export class OnboardingComponent {
  entityName = ''; jurisdiction = ''; documents = '';
  response = ''; loading = false; error: string | null = null;
  constructor(private lyzr: LyzrAgentService) {}
  assess() {
    this.loading = true; this.error = null;
    const msg = `New institutional client onboarding. Entity: ${this.entityName}. Jurisdiction: ${this.jurisdiction}. Documents provided: ${this.documents || 'none'}. Assess onboarding status, identify missing documents, classify risk, and provide next steps.`;
    this.lyzr.callAgent(environment.agents['onboarding'], msg).subscribe({
      next: (res) => { this.response = res.response; this.loading = false; },
      error: () => { this.error = 'Failed to connect to Onboarding Agent.'; this.loading = false; }
    });
  }
  runTest(e: string, j: string, d: string) { this.entityName = e; this.jurisdiction = j; this.documents = d; this.assess(); }
}
