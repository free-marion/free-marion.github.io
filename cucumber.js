module.exports = {
  // Unit tests: pure function tests, no browser, no network.
  default: {
    paths:   ['tests/features/unit/**/*.feature'],
    require: ['tests/step_definitions/unit/**/*.steps.js'],
    format:  ['progress-bar'],
  },

  // Integration tests: headless browser against local Supabase.
  // Requires: supabase start (Docker)
  integration: {
    paths:   ['tests/features/integration/**/*.feature'],
    require: [
      'tests/support/world.js',
      'tests/step_definitions/integration/**/*.steps.js',
    ],
    format: ['progress-bar', 'html:tests/reports/cucumber-integration-report.html'],
  },
};
