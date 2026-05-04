const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const {
  isWeekend,
  generateSlots,
  generateConfirmationNo,
  SLOT_INTERVAL_MINUTES,
} = require('../../../src/tee-utils');

let dateStr;
let slots;
let weekendResult;
let confirmationNo;

// ── Givens ─────────────────────────────────────────────────────────────────

Given('a Saturday in the future', function () {
  dateStr = '2026-05-09'; // Saturday, 5 days out — safely past the 30-min cutoff
});

Given('a Monday in the future', function () {
  dateStr = '2026-05-11'; // Monday
});

Given('a Wednesday in the future', function () {
  dateStr = '2026-05-13'; // Wednesday
});

Given('the date string {string}', function (ds) {
  dateStr = ds;
});

// ── Whens ───────────────────────────────────────────────────────────────────

When('I generate tee time slots for that date', function () {
  slots = generateSlots(dateStr);
});

When('I check if it falls on a weekend', function () {
  weekendResult = isWeekend(dateStr);
});

When('I generate a confirmation number', function () {
  confirmationNo = generateConfirmationNo();
});

// ── Thens ───────────────────────────────────────────────────────────────────

Then('the first slot should start at {int} AM', function (expectedHour) {
  expect(slots, 'no slots were generated').to.have.length.greaterThan(0);
  const firstSlotLocalHour = new Date(slots[0]).getHours();
  expect(firstSlotLocalHour).to.equal(
    expectedHour,
    `expected first slot at ${expectedHour}:00 AM but got hour ${firstSlotLocalHour}`
  );
});

Then('consecutive slots should be exactly 10 minutes apart', function () {
  expect(slots, 'need at least 2 slots to compare').to.have.length.greaterThan(1);
  const expectedGapMs = SLOT_INTERVAL_MINUTES * 60 * 1000;
  for (let i = 1; i < slots.length; i++) {
    const gap = new Date(slots[i]) - new Date(slots[i - 1]);
    expect(gap).to.equal(
      expectedGapMs,
      `gap between slot ${i - 1} and ${i} was ${gap / 60000} minutes, expected 10`
    );
  }
});

Then('the result should be true', function () {
  expect(weekendResult).to.be.true;
});

Then('the result should be false', function () {
  expect(weekendResult).to.be.false;
});

Then('it should match the pattern {string}', function (pattern) {
  expect(confirmationNo).to.match(/^CW-\d{4}$/,
    `confirmation number "${confirmationNo}" did not match CW-NNNN`
  );
});
