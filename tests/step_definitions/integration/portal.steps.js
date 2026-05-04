const { Given, When, Then } = require('@cucumber/cucumber');

const PORTAL_PATH     = '/portal/index.html';
const PORTAL_PASSWORD = 'Arabia';

// ── Givens ───────────────────────────────────────────────────────────────────

Given('I am logged into the portal', { timeout: 15_000 }, async function () {
  await this.goto(PORTAL_PATH);
  await this.page.fill('#loginPassword', PORTAL_PASSWORD);
  await this.page.click('#loginBtn');
  await this.page.waitForSelector('#appShell:not([hidden])', { timeout: 10_000 });
});

Given('I am on the portal login screen', { timeout: 15_000 }, async function () {
  await this.goto(PORTAL_PATH);
});

// ── Whens ────────────────────────────────────────────────────────────────────

When('I submit the password {string}', async function (password) {
  await this.page.fill('#loginPassword', password);
  await this.page.click('#loginBtn');
});

When('I view the Tournaments tab', { timeout: 15_000 }, async function () {
  await this.page.click('[data-tab="tournaments"]');
  // Wait until the loading placeholder is gone and real content is rendered
  await this.page.waitForFunction(() => {
    const list = document.getElementById('tournamentsList');
    return list && list.children.length > 0 && !list.innerHTML.includes('Loading');
  }, { timeout: 10_000 });
});

When('I view the Egg Orders tab', { timeout: 15_000 }, async function () {
  await this.page.click('[data-tab="eggs"]');
  await this.page.waitForFunction(() => {
    const list  = document.getElementById('eggsList');
    const empty = document.getElementById('eggsEmpty');
    if (!list || list.innerHTML.includes('Loading')) return false;
    return list.children.length > 0 || (empty && !empty.hidden);
  }, { timeout: 10_000 });
});

// ── Thens ────────────────────────────────────────────────────────────────────

Then('the app shell should be visible', async function () {
  const hidden = await this.page.$eval('#appShell', el => el.hidden);
  this.expect(hidden).toBe(false);
});

Then('the login screen should be hidden', async function () {
  const hidden = await this.page.$eval('#loginScreen', el => el.hidden);
  this.expect(hidden).toBe(true);
});

Then('I should see the error {string}', async function (message) {
  const errEl = this.page.locator('#loginError');
  await this.expect(errEl).toBeVisible({ timeout: 3_000 });
  await this.expect(errEl).toContainText(message);
});

Then('the login screen should still be visible', async function () {
  const hidden = await this.page.$eval('#loginScreen', el => el.hidden);
  this.expect(hidden).toBe(false);
});

Then('I should see {string} in the tournament list', async function (name) {
  await this.expect(this.page.locator('#tournamentsList')).toContainText(name);
});

Then('the tournament list should contain {string} for {string}', async function (text, tournamentName) {
  // Find the card that contains the tournament name, then check it has the expected text
  const card = this.page.locator('.data-card', { hasText: tournamentName });
  await this.expect(card).toContainText(text);
});

Then('{string} should show {string} registrations', async function (tournamentName, count) {
  const card = this.page.locator('.data-card', { hasText: tournamentName });
  await this.expect(card).toContainText(`View Registrations (${count})`);
});

Then('I should see {string} in the egg orders list', async function (name) {
  await this.expect(this.page.locator('#eggsList')).toContainText(name);
});

Then('I should not see {string} in the egg orders list', async function (name) {
  await this.expect(this.page.locator('#eggsList')).not.toContainText(name);
});
