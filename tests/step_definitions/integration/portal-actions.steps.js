const { Given, When, Then } = require('@cucumber/cucumber');

// ── Shared helpers ────────────────────────────────────────────────────────────

async function waitForTournamentList(page) {
  await page.waitForFunction(() => {
    const list = document.getElementById('tournamentsList');
    return list && list.children.length > 0 && !list.innerHTML.includes('Loading');
  }, { timeout: 10_000 });
}

async function waitForEggList(page) {
  await page.waitForFunction(() => {
    const list  = document.getElementById('eggsList');
    const empty = document.getElementById('eggsEmpty');
    if (!list || list.innerHTML.includes('Loading')) return false;
    return list.children.length > 0 || (empty && !empty.hidden);
  }, { timeout: 10_000 });
}

// ── Givens ───────────────────────────────────────────────────────────────────

Given('I am viewing the Egg Orders tab showing pending orders', { timeout: 20_000 }, async function () {
  await this.page.click('[data-tab="eggs"]');
  await waitForEggList(this.page);
});

Given('I am viewing the Tournaments tab', { timeout: 20_000 }, async function () {
  await this.page.click('[data-tab="tournaments"]');
  await waitForTournamentList(this.page);
});

// ── Whens ─────────────────────────────────────────────────────────────────────

When('I mark {string} as picked up', { timeout: 15_000 }, async function (name) {
  // Find the card for this person and click its "Mark Picked Up" button
  const card = this.page.locator('.data-card', { hasText: name });
  await card.locator('button', { hasText: 'Mark Picked Up' }).click();
  // Wait for the list to refresh
  await waitForEggList(this.page);
});

When('I switch the egg orders filter to {string}', { timeout: 10_000 }, async function (filterLabel) {
  await this.page.locator('.filter-btn', { hasText: filterLabel }).click();
  await waitForEggList(this.page);
});

When('I create a tournament named {string} on a future date with {int} slots', { timeout: 15_000 }, async function (name, slots) {
  await this.page.click('#addTournamentBtn');
  await this.page.fill('#tName', name);
  // Use a fixed future date
  await this.page.fill('#tDate', '2030-08-15');
  await this.page.fill('#tMaxSlots', String(slots));
  await this.page.click('#saveTournamentBtn');
  await waitForTournamentList(this.page);
});

When('I open the new tournament form and submit it empty', async function () {
  await this.page.click('#addTournamentBtn');
  await this.page.click('#saveTournamentBtn');
});

When('I click {string} for {string}', { timeout: 15_000 }, async function (buttonText, tournamentName) {
  const card = this.page.locator('.data-card', { hasText: tournamentName });
  await card.locator('button', { hasText: buttonText }).click();
  // Wait for the registrations panel to appear
  await this.page.waitForSelector('#registrationsPanel:not([hidden])', { timeout: 10_000 });
  // Wait for the list to populate
  await this.page.waitForFunction(() => {
    const list = document.getElementById('registrationsList');
    return list && list.children.length > 0;
  }, { timeout: 10_000 });
});

When('I cancel the tournament {string}', { timeout: 15_000 }, async function (tournamentName) {
  const card = this.page.locator('.data-card', { hasText: tournamentName });
  this.page.once('dialog', dialog => dialog.accept());
  await card.locator('button', { hasText: 'Cancel Event' }).first().click();
  await waitForTournamentList(this.page);
});

// ── Thens ─────────────────────────────────────────────────────────────────────

Then('{string} should no longer appear in the pending list', async function (name) {
  await this.expect(this.page.locator('#eggsList')).not.toContainText(name);
});

Then('{string} should appear in the tournament list', async function (name) {
  await this.expect(this.page.locator('#tournamentsList')).toContainText(name);
});

Then('I should see a form validation error', async function () {
  const errEl = this.page.locator('#tournamentFormError');
  await this.expect(errEl).toBeVisible({ timeout: 3_000 });
});

Then('I should see {string} in the registrations panel', async function (teamName) {
  await this.expect(this.page.locator('#registrationsList')).toContainText(teamName);
});

Then('the registrations panel should show {string}', async function (summaryText) {
  await this.expect(this.page.locator('#registrationsList')).toContainText(summaryText);
});

Then('{string} should show as cancelled in the list', async function (tournamentName) {
  const card = this.page.locator('.data-card', { hasText: tournamentName });
  await this.expect(card).toContainText('Cancelled');
});
