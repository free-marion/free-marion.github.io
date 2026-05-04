const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { urgencyClass, slotsLabel } = require('../../../src/event-utils');

Given('a tournament with status {string} and {int} max slots and {int} registered', function (status, maxSlots, registered) {
  this.tournament = { status, max_slots: maxSlots, registered_count: registered };
});

When('I compute the urgency class for a future date', function () {
  this.urgency = urgencyClass(this.tournament, false);
});

When('I compute the urgency class for a past date', function () {
  this.urgency = urgencyClass(this.tournament, true);
});

Then('the urgency class should be {string}', function (expected) {
  assert.strictEqual(this.urgency, expected);
});

Then('the slots label for urgency {string} should be {string}', function (urgency, expected) {
  assert.strictEqual(slotsLabel(this.tournament, urgency), expected);
});

Then('the slots label for urgency {string} should contain {string}', function (urgency, substring) {
  const label = slotsLabel(this.tournament, urgency);
  assert.ok(label.includes(substring), `Expected "${label}" to contain "${substring}"`);
});
