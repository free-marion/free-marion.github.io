const { World, setWorldConstructor, BeforeAll, AfterAll, After } = require('@cucumber/cucumber');
const { chromium, expect } = require('@playwright/test');
const { spawn }  = require('child_process');
const http       = require('http');
const path       = require('path');

const PROJECT_ROOT       = path.join(__dirname, '../..');
const SERVER_PORT        = 3001;
const PROD_SUPABASE_HOST = 'https://giwfigekjatujubjknjf.supabase.co';
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';

// Standard local-stack anon JWT (derived from the well-known dev JWT secret).
// Safe to commit — only valid against a local Supabase instance.
const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9' +
  '.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

function pollPort(port, timeoutMs = 20_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function attempt() {
      const req = http.get(`http://localhost:${port}`, () => { req.destroy(); resolve(); });
      req.on('error', () => {
        if (Date.now() > deadline) { reject(new Error(`Port ${port} not ready after ${timeoutMs}ms`)); return; }
        setTimeout(attempt, 250);
      });
      req.setTimeout(500, () => req.destroy());
    }
    attempt();
  });
}

const SUPABASE_HEADERS = {
  apikey: LOCAL_ANON_KEY,
  authorization: `Bearer ${LOCAL_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

async function supabaseDelete(table, query) {
  await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'DELETE',
    headers: SUPABASE_HEADERS,
  });
}

async function supabasePatch(table, query, body) {
  await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: SUPABASE_HEADERS,
    body: JSON.stringify(body),
  });
}

let browser;
let staticServer;

BeforeAll({ timeout: 40_000 }, async function () {
  // Wipe test-created records from any previous run so the suite is idempotent.
  await Promise.all([
    supabaseDelete('egg_orders',               'name=eq.Integration%20Test%20User'),
    supabaseDelete('tournament_registrations', 'team_name=like.Test*'),
    supabaseDelete('tournament_registrations', 'team_name=like.Temp*'),
    supabaseDelete('tournaments',              'name=like.Test*'),
    supabaseDelete('tournaments',              'name=like.Temp*'),
    supabasePatch ('egg_orders',               'name=eq.Dave%20Edwards', { status: 'pending' }),
  ]);

  browser = await chromium.launch({ headless: true });

  staticServer = spawn(
    'npx', ['http-server', '.', '-p', String(SERVER_PORT), '-c-1'],
    { cwd: PROJECT_ROOT, stdio: 'ignore' }
  );
  staticServer.on('error', err => { throw err; });

  await pollPort(SERVER_PORT);
});

AfterAll(async function () {
  await browser?.close();
  staticServer?.kill();
});

After(async function () {
  // Dismiss any routes still in flight before closing the context, otherwise
  // Playwright throws "page has been closed" errors from the route handler.
  if (this.page) await this.page.unrouteAll({ behavior: 'ignoreErrors' });
  await this.context?.close();
});

class CherrywoodWorld extends World {
  get expect() { return expect; }

  async goto(pagePath) {
    this.context = await browser.newContext();
    this.page    = await this.context.newPage();

    // Intercept every call to the production Supabase project. We can't use
    // route.continue() across protocols (https→http), so we fetch the request
    // from Node.js directly and fulfill the response back to the browser.
    await this.page.route(`${PROD_SUPABASE_HOST}/**`, async route => {
      const localUrl = route.request().url().replace(PROD_SUPABASE_HOST, LOCAL_SUPABASE_URL);
      const response = await route.fetch({
        url: localUrl,
        headers: {
          ...route.request().headers(),
          apikey:        LOCAL_ANON_KEY,
          authorization: `Bearer ${LOCAL_ANON_KEY}`,
        },
      });
      await route.fulfill({ response });
    });

    await this.page.goto(`http://localhost:${SERVER_PORT}${pagePath}`);
  }
}

setWorldConstructor(CherrywoodWorld);
