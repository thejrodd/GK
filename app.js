/* ════════════════════════════════════════
   GAMMA KAPPA CHAPTER · KAPPA ALPHA PSI
   app.js — Global JavaScript
════════════════════════════════════════ */

'use strict';

/* ── Helpers ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const pref = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ════════════════════════════════════════
   PAGE TRANSITION
════════════════════════════════════════ */
function initPageTransition() {
  const overlay = $('#pageTransition');
  if (!overlay) return;

  // Sweep out on load
  const sweepOut = () => {
    overlay.classList.remove('sweep-in');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => overlay.classList.add('sweep-out'))
    );
    setTimeout(() => overlay.classList.remove('sweep-out'), 500);
  };

  if (pref()) return;

  // Sweep in on internal link click, sweep out on next page
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
    if (link.target === '_blank') return;

    e.preventDefault();
    overlay.classList.remove('sweep-out');
    overlay.classList.add('sweep-in');
    setTimeout(() => { window.location.href = href; }, 360);
  });

  // On page load: sweep out
  window.addEventListener('load', sweepOut);
  // Fallback if load already fired
  if (document.readyState === 'complete') sweepOut();
}

/* ════════════════════════════════════════
   NAVBAR
════════════════════════════════════════ */
function initNavbar() {
  const navbar     = $('#navbar');
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  if (!navbar) return;

  // Scroll → frosted glass
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active link highlighting based on current page filename
  const path = window.location.pathname;
  const file = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  $$('.nav-link, .mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkFile = href.substring(href.lastIndexOf('/') + 1);
    const isHome = (file === 'index.html' || file === '') && (linkFile === 'index.html' || linkFile === '');
    if (linkFile === file || isHome) {
      link.classList.add('active');
    }
  });

  // Hamburger
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on mobile link click
  $$('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobile);
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) closeMobile();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobile();
  });

  function closeMobile() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

/* ════════════════════════════════════════
   DIAMOND CANVAS
════════════════════════════════════════ */
function initDiamondCanvas(canvasEl) {
  if (!canvasEl) return;

  const ctx = canvasEl.getContext('2d');
  let animId, W, H, time = 0;
  let diamonds = [];
  let scrollY = 0;

  const GOLD    = 'rgba(200,150,62,';
  const CRIMSON = 'rgba(139,0,0,';

  function resize() {
    W = canvasEl.width  = canvasEl.offsetWidth;
    H = canvasEl.height = canvasEl.offsetHeight;
    diamonds = buildGrid();
  }

  function buildGrid() {
    const size = Math.max(W, H) < 600 ? 62 : 88;
    const cols = Math.ceil(W / size) + 3;
    const rows = Math.ceil(H / size) + 3;
    const out  = [];
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const off = (r % 2) * (size / 2);
        out.push({
          x: c * size + off,
          y: r * size * 0.88,
          s: size * 0.40,
          phase: ((c * 0.41 + r * 0.57) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2),
        });
      }
    }
    return out;
  }

  function drawDiamond(x, y, s, alpha) {
    // Outer diamond
    ctx.beginPath();
    ctx.moveTo(x,     y - s);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x,     y + s);
    ctx.lineTo(x - s, y);
    ctx.closePath();
    ctx.strokeStyle = GOLD + alpha.toFixed(3) + ')';
    ctx.lineWidth   = 0.85;
    ctx.stroke();

    // Inner diamond
    const i = s * 0.52;
    ctx.beginPath();
    ctx.moveTo(x,   y - i);
    ctx.lineTo(x+i, y);
    ctx.lineTo(x,   y + i);
    ctx.lineTo(x-i, y);
    ctx.closePath();
    ctx.strokeStyle = CRIMSON + (alpha * 0.35).toFixed(3) + ')';
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }

  function frame() {
    time += 0.007;

    // Parallax offset
    const offsetY = pref() ? 0 : scrollY * 0.15;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(0, -offsetY % (88 * 0.88));

    diamonds.forEach(d => {
      const pulse = pref() ? 0.14 : 0.10 + 0.08 * Math.sin(time + d.phase);
      drawDiamond(d.x, d.y, d.s, pulse);
    });

    ctx.restore();

    if (!pref()) animId = requestAnimationFrame(frame);
    else {
      // Static frame
      ctx.clearRect(0, 0, W, H);
      diamonds.forEach(d => drawDiamond(d.x, d.y, d.s, 0.14));
    }
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvasEl.parentElement || canvasEl);

  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  resize();
  frame();
}

/* Init all canvases on page */
function initAllCanvases() {
  $$('.diamond-canvas').forEach(c => initDiamondCanvas(c));
}

/* ════════════════════════════════════════
   SCROLL REVEAL
════════════════════════════════════════ */
function initScrollReveal() {
  const targets = $$('.reveal-up, .reveal-left, .reveal-right, .reveal-fade');
  if (!targets.length) return;

  if (pref()) {
    targets.forEach(el => el.classList.add('revealed'));
    return;
  }

  // Apply stagger to sibling groups
  $$('[data-stagger-parent]').forEach(parent => {
    $$('.reveal-up, .reveal-left, .reveal-right, .reveal-fade', parent).forEach((el, i) => {
      el.style.setProperty('--stagger', `${i * 80}ms`);
    });
  });

  // Auto-stagger direct children of grids
  $$('.grid-2, .grid-3, .grid-4, .grid-auto-240, .grid-auto-200, .grid-auto-280, .grid-photo, .pillars-grid, .events-list, .brothers-grid').forEach(grid => {
    $$(':scope > *', grid).forEach((child, i) => {
      if (child.matches('.reveal-up, .reveal-left, .reveal-right, .reveal-fade')) {
        child.style.setProperty('--stagger', `${i * 80}ms`);
      }
    });
  });

  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        observer.unobserve(e.target);
      }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  targets.forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════
   HERO REVEAL (animate in on load)
════════════════════════════════════════ */
function initHeroReveal() {
  const heroEls = $$('.hero .reveal-fade, .hero .reveal-up, .hero .reveal-left, .hero .reveal-right');
  if (pref()) { heroEls.forEach(el => el.classList.add('revealed')); return; }
  heroEls.forEach((el, i) => {
    setTimeout(() => el.classList.add('revealed'), 250 + i * 160);
  });
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
    successMsg && (successMsg.hidden = true);
    errorMsg   && (errorMsg.hidden   = true);

    const missing = $$('[required]', form).filter(f => !f.value.trim());
    if (missing.length) {
      if (errorMsg) errorMsg.hidden = false;
      missing[0].focus();
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    setTimeout(() => {
      if (successMsg) successMsg.hidden = false;
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Message`;
      }
      // Auto-hide success after 3.5s
      setTimeout(() => { if (successMsg) successMsg.hidden = true; }, 3500);
    }, 1200);
  });
}

/* ════════════════════════════════════════
   FOOTER YEAR
════════════════════════════════════════ */
function initFooterYear() {
  $$('.footer-year').forEach(el => { el.textContent = new Date().getFullYear(); });
}

/* ════════════════════════════════════════
   ANCHOR SCROLL (for same-page hash links)
════════════════════════════════════════ */
function initAnchorScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: pref() ? 'auto' : 'smooth' });
  });
}

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();
  initNavbar();
  initAllCanvases();
  initScrollReveal();
  initHeroReveal();
  initContactForm();
  initFooterYear();
  initAnchorScroll();
});
