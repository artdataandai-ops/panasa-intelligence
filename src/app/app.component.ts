import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-layout">
      <nav class="sidebar">
        <div class="sidebar-constellation"></div>
        <div class="sidebar-content">
          <div class="sidebar-header">
            <div class="logo-wrap">
              <img src="assets/artlogo.png" alt="Panasa" class="sidebar-logo" />
            </div>
            <div class="brand">
              <span class="brand-name">Art</span>
              <span class="brand-sub">Intelligence Platform</span>
            </div>
          </div>
          <div class="nav-section-label">MODULES</div>
          <ul class="nav-links">
            <li><a routerLink="/dashboard" routerLinkActive="active">
              <span class="nav-icon">⊞</span> Dashboard
            </a></li>
            <li><a routerLink="/fx" routerLinkActive="active">
              <span class="nav-icon">₤</span> FX Pricing
            </a></li>
            <li><a routerLink="/regulatory" routerLinkActive="active">
              <span class="nav-icon">⚖</span> Regulatory
            </a></li>
            <li><a routerLink="/settlement" routerLinkActive="active">
              <span class="nav-icon">⚡</span> Settlement
            </a></li>
            <li><a routerLink="/scheme-compliance" routerLinkActive="active">
              <span class="nav-icon">🃏</span> Scheme Compliance
            </a></li>
          </ul>
          <div class="sidebar-bottom">
            <button class="theme-btn" (click)="toggleTheme()">
              <span class="theme-icon">{{ isDark ? '✦' : '☀' }}</span>
              {{ isDark ? 'Light Mode' : 'Dark Mode' }}
            </button>
            <div class="sidebar-footer">
              <span class="powered">Powered by Lyzr AI</span>
            </div>
          </div>
        </div>
      </nav>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; }

    /* Sidebar */
    .sidebar {
      width: 230px; display: flex; flex-direction: column; flex-shrink: 0;
      position: relative; overflow: hidden;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--sidebar-border);
      color: var(--sidebar-text);
    }

    /* Constellation / network pattern background */
    .sidebar-constellation {
      position: absolute; inset: 0; z-index: 0; opacity: var(--sidebar-constellation-opacity); pointer-events: none;
      background-image:
        radial-gradient(1.5px 1.5px at 20px 60px, rgba(245,192,16,0.7) 50%, transparent 50%),
        radial-gradient(1.5px 1.5px at 80px 140px, rgba(245,192,16,0.5) 50%, transparent 50%),
        radial-gradient(1px 1px at 140px 200px, rgba(245,192,16,0.4) 50%, transparent 50%),
        radial-gradient(2px 2px at 40px 300px, rgba(245,192,16,0.6) 50%, transparent 50%),
        radial-gradient(1.5px 1.5px at 160px 380px, rgba(245,192,16,0.5) 50%, transparent 50%),
        radial-gradient(1px 1px at 100px 450px, rgba(245,192,16,0.4) 50%, transparent 50%),
        radial-gradient(2px 2px at 60px 520px, rgba(245,192,16,0.6) 50%, transparent 50%),
        radial-gradient(1.5px 1.5px at 180px 100px, rgba(245,192,16,0.3) 50%, transparent 50%),
        radial-gradient(1px 1px at 30px 180px, rgba(245,192,16,0.35) 50%, transparent 50%),
        radial-gradient(1.5px 1.5px at 120px 280px, rgba(245,192,16,0.5) 50%, transparent 50%),
        radial-gradient(1px 1px at 190px 480px, rgba(245,192,16,0.4) 50%, transparent 50%),
        radial-gradient(1.5px 1.5px at 50px 600px, rgba(245,192,16,0.5) 50%, transparent 50%);
      background-size: 230px 700px;
    }
    .sidebar-constellation::after {
      content: '';
      position: absolute; inset: 0;
      background:
        linear-gradient(45deg, transparent 48%, rgba(245,192,16,0.06) 49%, rgba(245,192,16,0.06) 51%, transparent 52%),
        linear-gradient(-30deg, transparent 48%, rgba(245,192,16,0.04) 49%, rgba(245,192,16,0.04) 51%, transparent 52%),
        linear-gradient(60deg, transparent 48%, rgba(245,192,16,0.05) 49%, rgba(245,192,16,0.05) 51%, transparent 52%);
      background-size: 200px 200px;
    }

    .sidebar-content { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }

    .sidebar-header {
      padding: 22px 16px 18px; display: flex; align-items: center; gap: 12px;
      border-bottom: 1px solid var(--sidebar-border);
    }
    .logo-wrap { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sidebar-logo { width: 38px; height: 38px; object-fit: contain; border-radius: 8px; }
    .brand-name { display: block; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; color: var(--yellow); }
    .brand-sub { display: block; font-size: 10px; color: var(--sidebar-muted); margin-top: 2px; letter-spacing: 0.5px; text-transform: uppercase; }

    .nav-section-label {
      padding: 18px 18px 8px; font-size: 10px; font-weight: 700;
      color: var(--sidebar-muted); letter-spacing: 1.5px; text-transform: uppercase;
    }

    .nav-links { list-style: none; padding: 0; margin: 0; flex: 1; }
    .nav-links li a {
      display: flex; align-items: center; gap: 10px;
      padding: 11px 18px; color: var(--sidebar-link); text-decoration: none;
      font-size: 13px; transition: all 0.2s; border-left: 3px solid transparent;
    }
    .nav-links li a:hover {
      background: var(--sidebar-hover-bg); color: var(--sidebar-hover-text);
      border-left-color: rgba(245,192,16,0.3); text-decoration: none;
    }
    .nav-links li a.active {
      background: var(--sidebar-active-bg); color: var(--yellow);
      border-left-color: var(--yellow); font-weight: 600;
    }

    .nav-icon { font-size: 15px; width: 20px; text-align: center; }

    .sidebar-bottom { margin-top: auto; }

    /* Theme button */
    .theme-btn {
      display: flex; align-items: center; gap: 8px; width: calc(100% - 24px);
      margin: 8px 12px; padding: 10px 16px; border-radius: 8px;
      background: var(--yellow); color: #1a1a1a; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: background 0.2s;
    }
    .theme-btn:hover { background: var(--yellow-dark); }
    .theme-icon { font-size: 14px; }

    .sidebar-footer { padding: 12px 18px; border-top: 1px solid var(--sidebar-border); }
    .powered { font-size: 10px; color: var(--sidebar-muted); letter-spacing: 0.5px; text-transform: uppercase; }

    /* Main content */
    .main-content {
      flex: 1; overflow-y: auto;
      background-color: var(--app-bg);
      transition: background-color 0.3s ease;
    }
  `]
})
export class AppComponent implements OnInit {
  isDark = true;

  ngOnInit() {
    const saved = localStorage.getItem('panasa-theme');
    if (saved === 'light') {
      this.isDark = false;
    }
    this.applyTheme();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    localStorage.setItem('panasa-theme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
  }
}
