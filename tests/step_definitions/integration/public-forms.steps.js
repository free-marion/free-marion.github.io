const { Given, When, Then } = require('@cucumber/cucumber');

const MAIN_SITE_PATH = '/index.html';
const EVENTS_PATH    = '/events.html';

const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9' +
  '.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const SUPABASE_HEADERS = {
  apikey: LOCAL_ANON_KEY,
  'Content-Type': 'application/json',
};

// ── Givens ───────────────────────────────────────────────────────────────────

Given('I am on the main site', { timeout: 15_000 }, async function () {
  await this.goto(MAIN_SITE_PATH);
});

Given('I am on the events page', { timeout: 15_000 }, async function () {
  await this.goto(EVENTS_PATH);
  // Wait for event cards to render (or the empty-state message)
  await this.page.waitForFunction(() => {
    const grid = document.getElementById('eventCardsGrid');
    return grid && (grid.children.length > 0 || grid.textContent.includes('No upcoming'));
  }, { timeout: 10_000 });
});

// ── Whens ─────────────────────────────────────────────────────────────────────

When('I fill out the egg reservation form with valid details', async function () {
  await this.page.fill('#egg-name', 'Integration Test User');
  await this.page.fill('#egg-contact', '555-9999');
  await this.page.selectOption('#egg-qty', '2');
  await this.page.fill('#egg-date', '2030-06-01');
  await this.page.click('#eggSubmitBtn');
});

When('I submit the egg form without filling in my name', async function () {
  await this.page.fill('#egg-contact', '555-8888');
  await this.page.fill('#egg-date', '2030-06-01');
  await this.page.click('#eggSubmitBtn');
});

When('I click the {string} event card', { timeout: 10_000 }, async function (eventName) {
  const card = this.page.locator('#eventCardsGrid .event-card', { hasText: eventName }).first();
  await card.click();
  // Wait for the detail panel content to update with this tournament's name
  await this.page.waitForFunction(
    name => document.getElementById('eventDetailContent')?.textContent.includes(name),
    eventName,
    { timeout: 5_000 }
  );
});

When('I register for {string} with team name {string} and captain {string}', { timeout: 20_000 }, async function (eventName, teamName, captainName) {
  // Click the event card to open its detail
  const card = this.page.locator('#eventCardsGrid .event-card', { hasText: eventName }).first();
  await card.click();
  await this.page.waitForFunction(
    name => document.getElementById('eventDetailContent')?.textContent.includes(name),
    eventName,
    { timeout: 5_000 }
  );

  // Reveal the registration form
  await this.page.click('#openRegBtn');
  await this.page.waitForSelector('#regFormInner', { timeout: 5_000 });

  // Fill and submit
  const teamInput = this.page.locator('#rf-team');
  if (await teamInput.isVisible()) await teamInput.fill(teamName);
  await this.page.fill('#rf-name', captainName);
  await this.page.fill('#rf-phone', '555-7777');
  await this.page.click('#rf-submit');
});

// ── Thens ─────────────────────────────────────────────────────────────────────

Then('I should see the egg success message', { timeout: 10_000 }, async function () {
  const msgEl = this.page.locator('#eggMsg');
  await this.expect(msgEl).toBeVisible({ timeout: 8_000 });
  await this.expect(msgEl).toContainText("We'll have your eggs ready");
});

Then('a new egg order should exist in the database', async function () {
  const res  = await fetch(
    'http://127.0.0.1:54321/rest/v1/egg_orders?name=eq.Integration%20Test%20User&select=name,dozens',
    { headers: SUPABASE_HEADERS }
  );
  const rows = await res.json();
  this.expect(rows.length).toBeGreaterThan(0);
  this.expect(rows[0].name).toBe('Integration Test User');
});

Then('the form should not submit', async function () {
  await this.expect(this.page.locator('#eggMsg')).toBeHidden();
});

Then('I should see {string} in the upcoming events list', async function (eventName) {
  await this.expect(this.page.locator('#eventCardsGrid')).toContainText(eventName);
});

Then('I should not see {string} in the upcoming events list', async function (eventName) {
  await this.expect(this.page.locator('#eventCardsGrid')).not.toContainText(eventName);
});

Then('I should see a {string} button in the detail panel', async function (buttonText) {
  const btn = this.page.locator('#eventDetailContent', { hasText: buttonText });
  await this.expect(btn).toBeVisible({ timeout: 3_000 });
});

Then('I should see a registration success message', { timeout: 10_000 }, async function () {
  const success = this.page.locator('.reg-form__success');
  await this.expect(success).toBeVisible({ timeout: 8_000 });
});

Then('{string} should be registered in the database', async function (teamName) {
  const res  = await fetch(
    `http://127.0.0.1:54321/rest/v1/tournament_registrations?team_name=eq.${encodeURIComponent(teamName)}&select=team_name,status`,
    { headers: SUPABASE_HEADERS }
  );
  const rows = await res.json();
  this.expect(rows.length).toBeGreaterThan(0);
  this.expect(rows[0].status).toBe('confirmed');
});
