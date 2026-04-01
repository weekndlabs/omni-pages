// ============================================
// OMNI Landing Page — Interactions
// ============================================

// --- Semantic Signal Flow Background ---
function initAIAnimation() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, particles = [], signals = [];

  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', resize);
  resize();

  class SignalParticle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 100;
      this.speed = 0.2 + Math.random() * 0.7;
      this.size = 1 + Math.random() * 2;
      this.opacity = 0.05 + Math.random() * 0.15;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.01 + Math.random() * 0.02;
      this.color = Math.random() > 0.5 ? '168, 85, 247' : '34, 211, 238';
    }
    update() {
      this.y -= this.speed;
      this.wobble += this.wobbleSpeed;
      this.x += Math.sin(this.wobble) * 0.3;

      if (this.y < -10) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
      ctx.fill();
    }
  }

  class SignalStream {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = height + 50;
      this.length = 30 + Math.random() * 120;
      this.speed = 0.3 + Math.random() * 0.6;
      this.opacity = 0.08 + Math.random() * 0.12;
      this.thickness = 1 + Math.random() * 1.5;
      this.color = Math.random() > 0.5 ? '168, 85, 247' : '34, 211, 238';
      this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
      this.y -= this.speed;
      this.pulse += 0.02;
      if (this.y < -this.length) this.reset();
    }
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.length);
      const pulseAlpha = this.opacity * (0.7 + 0.3 * Math.sin(this.pulse));

      grad.addColorStop(0, `rgba(${this.color}, 0)`);
      grad.addColorStop(0.3, `rgba(${this.color}, ${pulseAlpha})`);
      grad.addColorStop(1, `rgba(${this.color}, 0)`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = this.thickness;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x, this.y + this.length);
      ctx.stroke();
    }
  }

  // Spawn particles
  for (let i = 0; i < 120; i++) particles.push(new SignalParticle());
  for (let i = 0; i < 30; i++) signals.push(new SignalStream());

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Ambient gradient glow
    const centerGlow = ctx.createRadialGradient(width/2, height/3, 0, width/2, height/3, width/1.3);
    centerGlow.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
    centerGlow.addColorStop(0.5, 'rgba(34, 211, 238, 0.03)');
    centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => { p.update(); p.draw(); });
    signals.forEach(s => { s.update(); s.draw(); });

    requestAnimationFrame(animate);
  }

  animate();
}

// --- Copy to Clipboard ---
function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 2000);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        const original = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 2000);
      }
    });
  });
}

// --- Scroll Reveal (Intersection Observer) ---
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal, .reveal-children').forEach(el => {
    observer.observe(el);
  });
}

// --- Navbar Scroll Effect ---
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const check = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', check, { passive: true });
  check();
}

// --- Mobile Menu Toggle ---
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    toggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      console.log('Link clicked, closing menu');
      navLinks.classList.remove('active');
      toggle.textContent = '☰';
    });
  });
}

// --- Smooth Scroll ---

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// --- Auto Fetch Latest GitHub Version ---
async function initLatestVersion() {
  const versionElement = document.querySelector('.hero-badge span:nth-child(2)');
  const tagElement = document.querySelector('.hero-badge .badge-tag');
  const textElement = document.querySelector('.hero-badge .badge-text');
  if (!versionElement) return;

  try {
    const res = await fetch('https://api.github.com/repos/fajarhide/omni/releases/latest', {
      cache: 'no-cache'
    });
    if (!res.ok) return;

    const data = await res.json();
    const tagName = data.tag_name;
    const latestVersion = tagName.replace(/^v/, '');

    // Auto detect release type from version tag
    let releaseStatus = 'Stable Release';
    let statusColor = '#22c55e';

    if (tagName.includes('-rc')) {
      releaseStatus = 'Release Candidate';
      statusColor = '#f59e0b';
    } else if (tagName.includes('-beta')) {
      releaseStatus = 'Beta';
      statusColor = '#a855f7';
    } else if (tagName.includes('-alpha')) {
      releaseStatus = 'Alpha';
      statusColor = '#ef4444';
    }

    // Smooth transition update
    versionElement.style.opacity = '0';
    versionElement.style.transform = 'translateY(-4px)';

    setTimeout(() => {
      versionElement.textContent = `v${latestVersion}`;
      if (tagElement) {
        tagElement.textContent = releaseStatus;
        tagElement.style.background = `rgba(${statusColor === '#22c55e' ? '34,197,94' : statusColor === '#f59e0b' ? '245,158,11' : statusColor === '#a855f7' ? '168,85,247' : '239,68,68'}, 0.15)`;
        tagElement.style.color = statusColor;
      }
      if (textElement) textElement.remove();

      versionElement.style.opacity = '1';
      versionElement.style.transform = 'translateY(0)';
    }, 200);

  } catch (err) {
    // Fail silently, keep hardcoded version as fallback
    console.debug('Could not fetch latest version:', err);
  }
}

// Update the DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
  initCopyButtons();
  initScrollReveal();
  initNavbarScroll();
  initAIAnimation(); // Replaced initStarfield with AI animation
  initSmoothScroll();
  initMobileMenu();
  initLatestVersion();
});
