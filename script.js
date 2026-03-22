// =====================
// NATURE SOUNDS
// =====================
(function() {
  const audio    = document.getElementById('ambience');
  const btn      = document.getElementById('soundToggle');
  const iconOn   = document.getElementById('soundIconOn');
  const iconOff  = document.getElementById('soundIconOff');
  let started    = false;
  let muted      = false;

  // Fade in helper
  function fadeIn(el, targetVol, duration) {
    el.volume = 0;
    const steps = 40;
    const interval = duration / steps;
    const increment = targetVol / steps;
    const timer = setInterval(() => {
      if (el.volume + increment >= targetVol) {
        el.volume = targetVol;
        clearInterval(timer);
      } else {
        el.volume += increment;
      }
    }, interval);
  }

  function startAudio() {
    if (started) return;
    started = true;
    audio.play().then(() => {
      fadeIn(audio, 0.18, 4000); // fade to 18% volume over 4 seconds
      btn.classList.add('sound-toggle--visible');
    }).catch(() => {
      // Autoplay blocked — hide button, try again on next interaction
      started = false;
    });
  }

  // Start on first user interaction
  ['click', 'scroll', 'touchstart', 'keydown'].forEach(evt => {
    document.addEventListener(evt, startAudio, { once: true });
  });

  // Mute / unmute toggle
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    muted = !muted;
    audio.volume = muted ? 0 : 0.18;
    iconOn.style.display  = muted ? 'none'  : '';
    iconOff.style.display = muted ? ''      : 'none';
  });
})();

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile nav when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// =====================
// COURSE CONDITIONS
// =====================

// Draw compass tick marks via JS so the SVG stays clean in HTML
(function drawTicks() {
  const g = document.getElementById('ticks');
  if (!g) return;
  for (let i = 0; i < 36; i++) {
    const angle = i * 10;
    const isMajor = i % 9 === 0; // N/E/S/W already labelled, skip those
    const isMinor = i % 3 === 0;
    const len = isMajor ? 0 : isMinor ? 10 : 6;
    const opacity = isMinor ? 0.5 : 0.2;
    const rad = (angle - 90) * Math.PI / 180;
    const cx = 100, cy = 100, r = 90;
    const x1 = cx + r * Math.cos(rad);
    const y1 = cy + r * Math.sin(rad);
    const x2 = cx + (r - len) * Math.cos(rad);
    const y2 = cy + (r - len) * Math.sin(rad);
    if (len === 0) continue;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'rgba(255,255,255,' + opacity + ')');
    line.setAttribute('stroke-width', isMinor ? '1.5' : '1');
    g.appendChild(line);
  }
})();

const WMO_CODES = {
  0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Icy Fog',
  51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
  80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
  85: 'Snow Showers', 86: 'Heavy Snow Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ Hail', 99: 'Thunderstorm w/ Heavy Hail'
};

function degreesToCompass(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

async function loadConditions() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=37.5583&longitude=-90.2955' +
      '&current=temperature_2m,wind_speed_10m,wind_direction_10m,weathercode' +
      '&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago'
    );
    const data = await res.json();
    const c = data.current;

    const windDeg  = c.wind_direction_10m;
    const windSpd  = Math.round(c.wind_speed_10m);
    const temp     = Math.round(c.temperature_2m);
    const desc     = WMO_CODES[c.weathercode] || 'Unknown';
    const updated  = new Date(c.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

    document.getElementById('windSpeed').textContent   = windSpd;
    document.getElementById('tempVal').textContent     = temp;
    document.getElementById('windDirLabel').textContent = degreesToCompass(windDeg) + ' wind';
    document.getElementById('needleWrap').style.transform = `rotate(${windDeg}deg)`;

    // Weather description in tee booking column
    const teeDesc = document.getElementById('teeWeatherDesc');
    if (teeDesc) teeDesc.textContent = desc;

  } catch (e) {
    document.getElementById('weatherDesc').textContent = 'Unable to load';
  }
}

loadConditions();

// =====================
// FARM FLIP CARDS
// =====================
document.querySelectorAll('.farm-card').forEach(card => {
  card.addEventListener('click', () => {
    const flipped = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
  });
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const flipped = card.classList.toggle('flipped');
      card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
    }
  });
});
