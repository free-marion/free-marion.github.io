// =============================================
// Cherrywood Farm & Golf Club
// Tee Time Booking System
// =============================================

(function () {
  'use strict';

  // --- Supabase client setup ---
  const SUPABASE_URL = 'https://giwfigekjatujubjknjf.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpd2ZpZ2VramF0dWp1YmprbmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDEwMDMsImV4cCI6MjA4OTU3NzAwM30.p3OaPA5qYROqz8d0tNyhytl__n_bzH2l2MOX3olDn3A';

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- Constants ---
  const MAX_PLAYERS_PER_SLOT = 4;
  const TOTAL_CARTS = 10;
  const SLOT_INTERVAL_MINUTES = 10;

  // --- State ---
  let selectedDate = null;     // 'YYYY-MM-DD'
  let selectedHoles = 9;
  let selectedSlot = null;     // ISO string of chosen slot_time
  let availabilityData = [];   // [{time, available_players, is_blocked}, ...]

  // --- DOM references ---
  const step1 = document.getElementById('teeStep1');
  const step2 = document.getElementById('teeStep2');
  const step3 = document.getElementById('teeStep3');
  const step4 = document.getElementById('teeStep4');

  const dateInput       = document.getElementById('teeDate');
  const showSlotsBtn    = document.getElementById('teeShowSlots');
  const step1Error      = document.getElementById('teeStep1Error');

  const backTo1Btn      = document.getElementById('teeBackTo1');
  const dateLabelEl     = document.getElementById('teeDateLabel');
  const slotsLoading    = document.getElementById('teeSlotsLoading');
  const slotsGrid       = document.getElementById('teeSlotsGrid');
  const step2Error      = document.getElementById('teeStep2Error');

  const backTo2Btn      = document.getElementById('teeBackTo2');
  const selectedSlotLabel = document.getElementById('teeSelectedSlotLabel');
  const bookingForm     = document.getElementById('teeBookingForm');
  const numPlayersSelect = document.getElementById('teeNumPlayers');
  const numCartsSelect   = document.getElementById('teeNumCarts');
  const confirmBtn       = document.getElementById('teeConfirmBtn');
  const step3Error       = document.getElementById('teeStep3Error');

  const confirmNoEl      = document.getElementById('teeConfirmNo');
  const confirmDetailsEl = document.getElementById('teeConfirmDetails');
  const bookAnotherBtn   = document.getElementById('teeBookAnother');

  // --- Utility functions ---

  function showStep(stepEl) {
    [step1, step2, step3, step4].forEach(s => {
      if (s === stepEl) {
        s.classList.remove('tee-step--hidden');
      } else {
        s.classList.add('tee-step--hidden');
      }
    });
  }

  function clearError(el) {
    el.textContent = '';
  }

  function setError(el, msg) {
    el.textContent = msg;
  }

  function formatDateDisplay(dateStr) {
    // dateStr is 'YYYY-MM-DD'
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatTimeDisplay(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago'
    });
  }

  function isWeekend(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    return dow === 0 || dow === 6;
  }

  function generateSlots(dateStr) {
    // Returns array of ISO strings for each slot on that date
    const weekend = isWeekend(dateStr);
    const startHour = weekend ? 8 : 9;
    const endHour = 17; // 5 PM (last slot starts before 5)

    const [y, m, d] = dateStr.split('-').map(Number);
    const slots = [];

    // Don't show slots that are already in the past (with 30-min buffer)
    const cutoff = new Date(Date.now() + 30 * 60 * 1000);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += SLOT_INTERVAL_MINUTES) {
        const dt = new Date(y, m - 1, d, hour, min, 0, 0);
        if (dt < cutoff) continue; // skip past or too-soon slots
        slots.push(dt.toISOString());
      }
    }

    return slots;
  }

  function localDateToISO(dateStr) {
    // Returns start-of-day and end-of-day ISO strings in local time
    const [y, m, d] = dateStr.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end   = new Date(y, m - 1, d, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  function generateConfirmationNo() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return 'CW-' + num;
  }

  function slotToLocalKey(isoString) {
    // Round-trip: slot stored as ISO, compare by local time value
    return new Date(isoString).getTime();
  }

  // --- Fetch availability ---
  async function fetchAvailability(dateStr, holes) {
    const { start, end } = localDateToISO(dateStr);

    // Fetch bookings for the day
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('slot_time, num_players, status')
      .gte('slot_time', start)
      .lte('slot_time', end)
      .neq('status', 'cancelled');

    if (bookingsError) throw new Error('Could not load availability. Please try again.');

    // Fetch blocks for the day
    const { data: blocksData, error: blocksError } = await supabase
      .from('blocks')
      .select('from_time, to_time')
      .lte('from_time', end)
      .gte('to_time', start);

    if (blocksError) throw new Error('Could not load availability. Please try again.');

    // Build a map: slot time (ms) -> booked player count
    const bookedMap = {};
    (bookingsData || []).forEach(b => {
      const key = slotToLocalKey(b.slot_time);
      bookedMap[key] = (bookedMap[key] || 0) + b.num_players;
    });

    // Generate all slots for the day
    const allSlots = generateSlots(dateStr);

    // Build availability array
    return allSlots.map(slotISO => {
      const slotMs = slotToLocalKey(slotISO);
      const slotTime = new Date(slotISO);

      // Check blocks
      const isBlocked = (blocksData || []).some(block => {
        const from = new Date(block.from_time).getTime();
        const to   = new Date(block.to_time).getTime();
        return slotMs >= from && slotMs <= to;
      });

      const bookedPlayers = bookedMap[slotMs] || 0;
      const availablePlayers = Math.max(0, MAX_PLAYERS_PER_SLOT - bookedPlayers);

      return {
        time: slotISO,
        booked_players: bookedPlayers,
        available_players: availablePlayers,
        is_blocked: isBlocked,
        is_full: availablePlayers === 0
      };
    });
  }

  // --- Create booking ---
  async function createBooking(formData) {
    let confirmationNo = generateConfirmationNo();

    const payload = {
      confirmation_no: confirmationNo,
      slot_time: selectedSlot,
      name: formData.name,
      phone: formData.phone,
      email: formData.email || null,
      num_players: formData.num_players,
      num_carts: formData.num_carts,
      holes: selectedHoles,
      notes: formData.notes || null,
      status: 'confirmed'
    };

    // Retry with new confirmation number if there's a conflict
    let retries = 3;
    while (retries > 0) {
      const { data, error } = await supabase
        .from('bookings')
        .insert([payload])
        .select('confirmation_no')
        .single();

      if (!error) {
        return data.confirmation_no;
      }

      // Unique violation on confirmation_no — try a new one
      if (error.code === '23505' && error.message.includes('confirmation_no')) {
        payload.confirmation_no = generateConfirmationNo();
        retries--;
        continue;
      }

      throw new Error('Booking failed: ' + (error.message || 'Unknown error'));
    }

    throw new Error('Could not generate a unique confirmation number. Please try again.');
  }

  // --- Populate player/cart selects ---
  function populatePlayerSelect(availablePlayers) {
    numPlayersSelect.innerHTML = '';
    const max = Math.min(availablePlayers, MAX_PLAYERS_PER_SLOT);
    for (let i = 1; i <= max; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i + (i === 1 ? ' player' : ' players');
      numPlayersSelect.appendChild(opt);
    }
    populateCartSelect(parseInt(numPlayersSelect.value, 10));
  }

  function populateCartSelect(numPlayers) {
    numCartsSelect.innerHTML = '';
    // Carts available is a rough estimate; assume up to min(numPlayers, TOTAL_CARTS)
    const maxCarts = Math.min(numPlayers, TOTAL_CARTS);
    for (let i = 0; i <= maxCarts; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i === 0 ? 'No cart' : i + (i === 1 ? ' cart' : ' carts');
      numCartsSelect.appendChild(opt);
    }
  }

  // --- Render slot grid ---
  function renderSlots(availability) {
    slotsGrid.innerHTML = '';
    slotsLoading.style.display = 'none';

    const available = availability.filter(s => !s.is_blocked && !s.is_full);

    if (availability.length === 0) {
      slotsGrid.innerHTML = '<p class="tee-no-slots">No tee times available for this date.</p>';
      return;
    }

    if (available.length === 0) {
      slotsGrid.innerHTML = '<p class="tee-no-slots">All tee times are fully booked for this date.</p>';
    }

    availability.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-pill';

      const timeLabel = formatTimeDisplay(slot.time);
      btn.dataset.time = slot.time;

      if (slot.is_blocked) {
        btn.classList.add('slot-pill--blocked');
        btn.disabled = true;
        btn.textContent = timeLabel;
        btn.title = 'This time is unavailable';
      } else if (slot.is_full) {
        btn.classList.add('slot-pill--full');
        btn.disabled = true;
        btn.textContent = timeLabel;
        btn.title = 'Full';
      } else {
        const remaining = slot.available_players;
        btn.innerHTML =
          timeLabel +
          '<span class="slot-cap">(' + remaining + '/' + MAX_PLAYERS_PER_SLOT + ')</span>';
        btn.addEventListener('click', () => selectSlot(slot, btn));
      }

      slotsGrid.appendChild(btn);
    });
  }

  function selectSlot(slot, pillEl) {
    // Deselect all
    slotsGrid.querySelectorAll('.slot-pill').forEach(p => p.classList.remove('slot-pill--selected'));
    pillEl.classList.add('slot-pill--selected');
    selectedSlot = slot.time;

    clearError(step2Error);

    // Move to step 3 after a brief moment
    setTimeout(() => {
      const timeStr = formatTimeDisplay(slot.time);
      const dateStr = formatDateDisplay(selectedDate);
      selectedSlotLabel.textContent = timeStr + ' \u2014 ' + dateStr + ' (' + selectedHoles + ' holes)';

      populatePlayerSelect(slot.available_players);
      clearError(step3Error);
      showStep(step3);
    }, 180);
  }

  // --- Step 1: show slots ---
  showSlotsBtn.addEventListener('click', async () => {
    clearError(step1Error);

    const dateVal = dateInput.value;
    if (!dateVal) {
      setError(step1Error, 'Please select a date.');
      return;
    }

    // Validate date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = dateVal.split('-').map(Number);
    const chosen = new Date(y, m - 1, d);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);

    if (chosen < today) {
      setError(step1Error, 'Please select today or a future date.');
      return;
    }
    if (chosen > maxDate) {
      setError(step1Error, 'Bookings can be made up to 30 days in advance.');
      return;
    }

    selectedDate = dateVal;

    // Show step 2
    dateLabelEl.textContent = formatDateDisplay(selectedDate);
    slotsLoading.style.display = 'block';
    slotsGrid.innerHTML = '';
    clearError(step2Error);
    showStep(step2);

    try {
      availabilityData = await fetchAvailability(selectedDate, selectedHoles);
      renderSlots(availabilityData);
    } catch (err) {
      slotsLoading.style.display = 'none';
      setError(step2Error, err.message || 'Unable to load availability. Please try again.');
    }
  });

  // --- Holes toggle ---
  document.querySelectorAll('.holes-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.holes-btn').forEach(b => b.classList.remove('holes-btn--active'));
      btn.classList.add('holes-btn--active');
      selectedHoles = parseInt(btn.dataset.holes, 10);
    });
  });

  // --- Back navigation ---
  backTo1Btn.addEventListener('click', () => {
    selectedSlot = null;
    showStep(step1);
  });

  backTo2Btn.addEventListener('click', () => {
    selectedSlot = null;
    // Re-render slots so selection is cleared
    if (availabilityData.length > 0) renderSlots(availabilityData);
    showStep(step2);
  });

  // --- Player count change updates cart options ---
  numPlayersSelect.addEventListener('change', () => {
    populateCartSelect(parseInt(numPlayersSelect.value, 10));
  });

  // --- Step 3: submit form ---
  bookingForm.addEventListener('submit', async e => {
    e.preventDefault();
    clearError(step3Error);

    if (!selectedSlot) {
      setError(step3Error, 'No time slot selected. Please go back and choose a slot.');
      return;
    }

    const name  = document.getElementById('teeName').value.trim();
    const phone = document.getElementById('teePhone').value.trim();
    const email = document.getElementById('teeEmail').value.trim();
    const notes = document.getElementById('teeNotes').value.trim();
    const numPlayers = parseInt(numPlayersSelect.value, 10);
    const numCarts   = parseInt(numCartsSelect.value, 10);

    if (!name) { setError(step3Error, 'Please enter your name.'); return; }
    if (!phone) { setError(step3Error, 'Please enter a phone number.'); return; }

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Confirming\u2026';

    try {
      // Re-check availability to guard against race conditions
      const freshAvailability = await fetchAvailability(selectedDate, selectedHoles);
      const slotCheck = freshAvailability.find(s => s.time === selectedSlot);

      if (!slotCheck) {
        throw new Error('Selected time slot is no longer valid. Please go back and choose another.');
      }
      if (slotCheck.is_blocked) {
        throw new Error('This time slot has been blocked. Please go back and choose another time.');
      }
      if (slotCheck.available_players < numPlayers) {
        throw new Error(
          'Only ' + slotCheck.available_players + ' spot' +
          (slotCheck.available_players === 1 ? '' : 's') +
          ' remaining in this slot. Please reduce your party size or choose another time.'
        );
      }

      const confirmationNo = await createBooking({
        name, phone, email, notes, num_players: numPlayers, num_carts: numCarts
      });

      // Build confirmation details
      confirmNoEl.textContent = 'Confirmation: ' + confirmationNo;

      confirmDetailsEl.innerHTML = [
        row('Date', formatDateDisplay(selectedDate)),
        row('Time', formatTimeDisplay(selectedSlot)),
        row('Holes', selectedHoles + ' holes'),
        row('Name', name),
        row('Phone', phone),
        email ? row('Email', email) : '',
        row('Players', numPlayers),
        numCarts > 0 ? row('Carts', numCarts) : '',
        notes ? row('Notes', notes) : ''
      ].filter(Boolean).join('');

      showStep(step4);

    } catch (err) {
      setError(step3Error, err.message || 'Booking failed. Please try again.');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm Booking';
    }
  });

  function row(label, value) {
    return '<div class="tee-confirm-row">' +
      '<span class="tee-confirm-label">' + label + '</span>' +
      '<span class="tee-confirm-value">' + value + '</span>' +
      '</div>';
  }

  // --- Book another ---
  bookAnotherBtn.addEventListener('click', () => {
    // Reset all state
    selectedDate = null;
    selectedSlot = null;
    selectedHoles = 9;
    availabilityData = [];
    dateInput.value = '';
    slotsGrid.innerHTML = '';
    document.getElementById('teeName').value = '';
    document.getElementById('teePhone').value = '';
    document.getElementById('teeEmail').value = '';
    document.getElementById('teeNotes').value = '';
    clearError(step1Error);
    clearError(step2Error);
    clearError(step3Error);
    // Reset holes toggle
    document.querySelectorAll('.holes-btn').forEach(b => {
      b.classList.toggle('holes-btn--active', parseInt(b.dataset.holes, 10) === 9);
    });
    showStep(step1);
  });

  // --- Set date input constraints ---
  function initDateInput() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm   = String(today.getMonth() + 1).padStart(2, '0');
    const dd   = String(today.getDate()).padStart(2, '0');
    const todayStr = yyyy + '-' + mm + '-' + dd;

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);
    const maxY  = maxDate.getFullYear();
    const maxM  = String(maxDate.getMonth() + 1).padStart(2, '0');
    const maxD  = String(maxDate.getDate()).padStart(2, '0');
    const maxStr = maxY + '-' + maxM + '-' + maxD;

    dateInput.setAttribute('min', todayStr);
    dateInput.setAttribute('max', maxStr);
    dateInput.value = todayStr;
  }

  initDateInput();

})();
