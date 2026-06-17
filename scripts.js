/* ════════════════════════════════════════
   GAMMA KAPPA CHAPTER · KAPPA ALPHA PSI
   scripts.js
════════════════════════════════════════ */

'use strict';

/* ── Utility ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ════════════════════════════════════════
   DIAMOND CANVAS — Animated Background
════════════════════════════════════════ */
function initDiamondCanvas() {
  const canvas = $('#diamondCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animId, W, H;
  let time = 0;

  const GOLD   = 'rgba(200,150,62,';
  const CRIMSON = 'rgba(139,0,0,';

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  /* Build a grid of diamond centers */
  function getDiamonds() {
    const size  = Math.max(W, H) < 600 ? 60 : 90;
    const cols  = Math.ceil(W / size) + 2;
    const rows  = Math.ceil(H / size) + 2;
    const diamonds = [];

    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const offset = (r % 2) * (size / 2);
        diamonds.push({
          x: c * size + offset,
          y: r * size * 0.9,
          s: size * 0.42,
          phase: (c * 0.37 + r * 0.53) % (Math.PI * 2),
        });
      }
    }
    return diamonds;
  }

  function drawDiamond(x, y, s, alpha) {
    ctx.beginPath();
    ctx.moveTo(x,     y - s);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x,     y + s);
    ctx.lineTo(x - s, y);
    ctx.closePath();

    ctx.strokeStyle = GOLD + alpha.toFixed(3) + ')';
    ctx.lineWidth   = 0.8;
    ctx.stroke();

    /* Inner smaller diamond */
    const inner = s * 0.55;
    ctx.beginPath();
    ctx.moveTo(x,         y - inner);
    ctx.lineTo(x + inner, y);
    ctx.lineTo(x,         y + inner);
    ctx.lineTo(x - inner, y);
    ctx.closePath();
    ctx.strokeStyle = CRIMSON + (alpha * 0.4).toFixed(3) + ')';
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }

  let diamonds = [];

  function frame() {
    if (prefersReducedMotion()) {
      /* Static render only */
      ctx.clearRect(0, 0, W, H);
      diamonds.forEach(d => drawDiamond(d.x, d.y, d.s, 0.18));
      return;
    }

    time += 0.008;
    ctx.clearRect(0, 0, W, H);

    diamonds.forEach(d => {
      const pulse = 0.10 + 0.08 * Math.sin(time + d.phase);
      drawDiamond(d.x, d.y, d.s, pulse);
    });

    animId = requestAnimationFrame(frame);
  }

  function start() {
    resize();
    diamonds = getDiamonds();
    cancelAnimationFrame(animId);
    frame();
  }

  const resizeObs = new ResizeObserver(() => {
    resize();
    diamonds = getDiamonds();
  });
  resizeObs.observe(canvas.parentElement);

  start();
}

/* ════════════════════════════════════════
   NAVBAR — scroll state + mobile menu
════════════════════════════════════════ */
function initNavbar() {
  const navbar    = $('#navbar');
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  if (!navbar) return;

  /* Scroll → frosted glass */
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Hamburger toggle */
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden',  String(!open));
    });

    /* Close on mobile link click */
    $$('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden',  'true');
      });
    });

    /* Close on outside click */
    document.addEventListener('click', e => {
      if (!navbar.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden',  'true');
      }
    });
  }
}

/* ════════════════════════════════════════
   PAGE TRANSITION — smooth nav clicks
════════════════════════════════════════ */
function initPageTransitions() {
  if (prefersReducedMotion()) return;

  const overlay = $('#pageTransition');
  if (!overlay) return;

  /* Anchor links within the same page get a soft flash transition */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    e.preventDefault();

    overlay.classList.add('active');
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth' });
      overlay.classList.remove('active');
    }, 180);
  });
}

/* ════════════════════════════════════════
   SCROLL REVEAL — Intersection Observer
════════════════════════════════════════ */
function initScrollReveal() {
  const targets = $$('.reveal-up, .reveal-left, .reveal-right, .reveal-fade');
  if (!targets.length) return;

  if (prefersReducedMotion()) {
    targets.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════
   CONTACT FORM
════════════════════════════════════════ */
function initContactForm() {
  const form       = $('#contactForm');
  const submitBtn  = $('#submitBtn');
  const successMsg = $('#formSuccess');
  const errorMsg   = $('#formError');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    /* Hide previous feedback */
    successMsg.hidden = true;
    errorMsg.hidden   = true;

    /* Basic validation */
    const required = $$('[required]', form);
    const invalid  = required.filter(field => !field.value.trim());

    if (invalid.length) {
      errorMsg.hidden = false;
      invalid[0].focus();
      return;
    }

    /* Disable & simulate async submit */
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    setTimeout(() => {
      successMsg.hidden = false;
      form.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Send Message`;
    }, 1400);
  });
}

/* ════════════════════════════════════════
   FOOTER — dynamic year
════════════════════════════════════════ */
function initFooterYear() {
  const el = $('#footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* ════════════════════════════════════════
   HERO REVEAL — stagger on load
════════════════════════════════════════ */
function initHeroReveal() {
  if (prefersReducedMotion()) {
    $$('.hero .reveal-fade, .hero .reveal-up').forEach(el => el.classList.add('revealed'));
    return;
  }

  const elements = $$('.hero .reveal-fade, .hero .reveal-up');
  elements.forEach((el, i) => {
    setTimeout(() => el.classList.add('revealed'), 300 + i * 180);
  });
}

/* ════════════════════════════════════════
   ACTIVE NAV LINK — highlight on scroll
════════════════════════════════════════ */
function initActiveNav() {
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          const active = link.getAttribute('href') === `#${id}`;
          link.style.color = active ? 'var(--gold)' : '';
        });
      });
    },
    { rootMargin: '-40% 0px -50% 0px' }
  );

  sections.forEach(sec => observer.observe(sec));
}

/* ════════════════════════════════════════
   BOOT
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initDiamondCanvas();
  initNavbar();
  initPageTransitions();
  initScrollReveal();
  initHeroReveal();
  initContactForm();
  initFooterYear();
  initActiveNav();
});
