const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { degreesToCompass, wmoDescription } = require('../../../src/weather-utils');

When('I convert {int} degrees to a compass direction', function (degrees) {
  this.result = degreesToCompass(degrees);
});

Then('I should get {string}', function (expected) {
  assert.strictEqual(this.result, expected);
});

When('I look up WMO code {int}', function (code) {
  this.result = wmoDescription(code);
});

Then('the description should be {string}', function (expected) {
  assert.strictEqual(this.result, expected);
});
