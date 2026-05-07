(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EventUtils = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  function urgencyClass(t, isPast) {
    if (t.status === 'draft')                            return 'draft';
    if (t.status === 'cancelled')                        return 'cancelled';
    if (isPast)                                          return 'past';
    const count     = t.registered_count || 0;
    const remaining = t.max_slots > 0 ? t.max_slots - count : null;
    if (remaining !== null && remaining <= 0)            return 'soldout';
    if (remaining !== null && remaining <= 2)            return 'critical';
    if (remaining !== null && remaining <= 5)            return 'low';
    return 'open';
  }

  function slotsLabel(t, urgency) {
    const count     = t.registered_count || 0;
    const remaining = t.max_slots > 0 ? t.max_slots - count : null;
    if (urgency === 'draft')     return 'Coming Soon';
    if (urgency === 'soldout')   return 'Sold Out';
    if (urgency === 'cancelled') return 'Cancelled';
    if (remaining === null)      return count > 0 ? `${count} registered` : '';
    if (urgency === 'critical')  return `🔴 Only ${remaining} left!`;
    if (urgency === 'low')       return `⚠️ ${remaining} spots left`;
    return `${remaining} of ${t.max_slots} spots open`;
  }

  return { urgencyClass, slotsLabel };
}));
