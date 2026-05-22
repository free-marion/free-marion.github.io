const { When, Then } = require('@cucumber/cucumber');

When('I click the Resources tab', async function () {
  await this.page.click('[data-tab="resources"]');
  await this.page.waitForSelector('#tabResources:not([hidden])');
});

Then('I should see a {string} tab in the sidebar', async function (label) {
  await this.expect(this.page.locator('.sidebar')).toContainText(label);
});

Then('the Resources panel should be visible', async function () {
  const hidden = await this.page.$eval('#tabResources', el => el.hidden);
  this.expect(hidden).toBe(false);
});

Then('the Tournaments panel should be hidden', async function () {
  const hidden = await this.page.$eval('#tabTournaments', el => el.hidden);
  this.expect(hidden).toBe(true);
});

Then('I should see a {string} section in Resources', async function (heading) {
  const panel = this.page.locator('#tabResources');
  await this.expect(panel).toContainText(heading);
});

Then('all resource links should open in a new tab', async function () {
  const links = await this.page.$$('#tabResources a.lib-item--link');
  for (const link of links) {
    const target = await link.getAttribute('target');
    const rel    = await link.getAttribute('rel');
    this.expect(target).toBe('_blank');
    this.expect(rel).toContain('noopener');
  }
});
