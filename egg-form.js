(function () {
  const SUPABASE_URL = 'https://giwfigekjatujubjknjf.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpd2ZpZ2VramF0dWp1YmprbmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDEwMDMsImV4cCI6MjA4OTU3NzAwM30.p3OaPA5qYROqz8d0tNyhytl__n_bzH2l2MOX3olDn3A';
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

  const form    = document.getElementById('eggForm');
  const msg     = document.getElementById('eggMsg');
  const btn     = document.getElementById('eggSubmitBtn');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Sending…';
    msg.style.display = 'none';

    const dozensRaw = document.getElementById('egg-qty').value;
    const dozens    = parseInt(dozensRaw) || 0;

    const { error } = await db.from('egg_orders').insert({
      name:        document.getElementById('egg-name').value.trim(),
      contact:     document.getElementById('egg-contact').value.trim(),
      dozens:      dozens || 1,
      pickup_date: document.getElementById('egg-date').value || null,
      notes:       document.getElementById('egg-notes').value.trim() || null,
      status:      'pending'
    });

    if (error) {
      msg.style.color = '#c0392b';
      msg.textContent = 'Something went wrong. Please call us to reserve.';
    } else {
      msg.style.color = '#2e7d32';
      msg.textContent = 'Reserved! We\'ll have your eggs ready.';
      form.reset();
    }

    msg.style.display = 'block';
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btn.disabled = false;
    btn.textContent = 'Reserve My Eggs';
  });
})();
