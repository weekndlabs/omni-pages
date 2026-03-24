// ============================================
// OMNI Landing Page — Interactions
// ============================================

// --- AI Animation (Semantic Distillation) ---
function initAIAnimation() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, lines = [];
  
  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  
  window.addEventListener('resize', resize);
  resize();

  class FlowLine {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.length = Math.random() * 80 + 20;
      this.speed = Math.random() * 0.5 + 0.1;
      this.opacity = Math.random() * 0.3 + 0.1;
      this.color = Math.random() > 0.5 ? '168, 85, 247' : '34, 211, 238'; // purple or cyan
    }
    update() {
      this.y -= this.speed;
      if (this.y < -this.length) {
        this.reset();
        this.y = height + this.length;
      }
    }
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.length);
      grad.addColorStop(0, `rgba(${this.color}, ${this.opacity})`);
      grad.addColorStop(1, `rgba(${this.color}, 0)`);
      
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x, this.y + this.length);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 40; i++) lines.push(new FlowLine());

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Subtle background glow
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/1.5);
    gradient.addColorStop(0, 'rgba(8, 8, 20, 0)');
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    lines.forEach(line => {
      line.update();
      line.draw();
    });

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

// Update the DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
  initCopyButtons();
  initScrollReveal();
  initNavbarScroll();
  initAIAnimation(); // Replaced initStarfield with AI animation
  initSmoothScroll();
  initMobileMenu();
});
