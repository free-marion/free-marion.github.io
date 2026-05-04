// Pure utility functions for tee-time slot generation.
// UMD wrapper: works as a CommonJS module (Node/tests) and as a browser script tag.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TeeUtils = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const SLOT_INTERVAL_MINUTES = 10;
  const MAX_PLAYERS_PER_SLOT  = 4;

  function isWeekend(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    return dow === 0 || dow === 6;
  }

  function generateSlots(dateStr) {
    const weekend   = isWeekend(dateStr);
    const startHour = weekend ? 8 : 9;
    const endHour   = 17;
    const [y, m, d] = dateStr.split('-').map(Number);
    const slots     = [];
    const cutoff    = new Date(Date.now() + 30 * 60 * 1000);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += SLOT_INTERVAL_MINUTES) {
        const dt = new Date(y, m - 1, d, hour, min, 0, 0);
        if (dt < cutoff) continue;
        slots.push(dt.toISOString());
      }
    }
    return slots;
  }

  function generateConfirmationNo() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return 'CW-' + num;
  }

  function formatDateDisplay(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  return { isWeekend, generateSlots, generateConfirmationNo, formatDateDisplay, SLOT_INTERVAL_MINUTES, MAX_PLAYERS_PER_SLOT };
}));
