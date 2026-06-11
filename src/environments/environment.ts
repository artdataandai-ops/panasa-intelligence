export const environment = {
  production: false,
  // Requests go to our own backend proxy. The path is RELATIVE (no leading slash)
  // so it resolves against <base href>: in dev (base "/") it hits /api/agent and is
  // proxied to the Node server via proxy.conf.json; in the prod container (base
  // "/panasa/") it hits /panasa/api/agent, which nginx strips and forwards to the
  // backend. The Lyzr API key lives ONLY on the server, never shipped to the browser.
  apiUrl: 'api/agent',
  agents: {
    manager:    '6a1dc89af6b085eee307e2f9',
    monitor:    '6a1874f7da56d8978dfe6d0b',
    onboarding: '6a1b4098f7a1eb202d6463d1',
    regulatory: '6a1c822167d6ab6e880b8db2',
    contracts:  '6a1c863f80c734da121493ca',
    fx:         '6a1db8f2e1bb0f24d59a05bc',
    settlement:       '6a1dc26d894f3fe88bd90740',
    schemeCompliance: '6a2244e338260b371a447edc'
  }
};
