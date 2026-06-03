/* ============================================================
   DIP Portfolio — JavaScript
   Handles: nav active state, mobile menu, accordion,
            latency canvas chart, scroll visibility
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. Mobile menu toggle
  ---------------------------------------------------------- */
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
      });
    });
  }

  /* ----------------------------------------------------------
     2. Active nav link on scroll
     Highlights the nav link matching the visible section.
  ---------------------------------------------------------- */
  const navLinks = document.querySelectorAll('.nav__links a');
  const sections = document.querySelectorAll('section[id]');

  function onScroll() {
    let currentId = '';

    sections.forEach(function (section) {
      const rect = section.getBoundingClientRect();
      // Section is "active" when its top is within 120px of the viewport top
      if (rect.top <= 120 && rect.bottom > 120) {
        currentId = section.id;
      }
    });

    navLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      if (href === '#' + currentId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Run once on load

  /* ----------------------------------------------------------
     3. Smooth scroll for all internal anchor links
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;

      e.preventDefault();
      const navHeight = document.querySelector('.nav').offsetHeight || 56;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ----------------------------------------------------------
     4. Accordion
     Each .accordion-item with a .accordion-trigger button
     toggles the open class on click.
  ---------------------------------------------------------- */
  document.querySelectorAll('.accordion-trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      const item = this.closest('.accordion-item');
      const isOpen = item.classList.toggle('open');

      // Optional: close other items in the same accordion
      if (isOpen) {
        const siblings = item.closest('.accordion').querySelectorAll('.accordion-item');
        siblings.forEach(function (sibling) {
          if (sibling !== item) {
            sibling.classList.remove('open');
          }
        });
      }
    });
  });

  /* ----------------------------------------------------------
     5. Latency timeline canvas chart
     Shows: stable (Jan 1-5) → spike (Jan 6-11) → drop (Jan 12-17)
     Data is based on stated pattern: 7s avg → 14s peak → 3s optimized
  ---------------------------------------------------------- */
  function drawLatencyChart() {
    const canvas = document.getElementById('latencyChart');
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');

    // DPI scaling for retina screens
    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.offsetWidth || 800;
    const displayH = 320;
    canvas.width  = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.height = displayH + 'px';
    ctx.scale(dpr, dpr);

    const W = displayW;
    const H = displayH;

    // Latency data points (Jan 1–17)
    // Pattern: stable (~7s) → spike after personalization on Jan 6 (~14s) → drop after optimization (~3s)
    const data = [7.2, 7.0, 7.4, 7.1, 7.6, 8.2, 11.4, 12.8, 13.5, 14.2, 13.1, 11.8, 8.4, 5.2, 4.1, 3.5, 3.2];
    const labels = ['1/1','1/2','1/3','1/4','1/5','1/6','1/7','1/8','1/9','1/10','1/11','1/12','1/13','1/14','1/15','1/16','1/17'];

    const pad = { top: 44, right: 24, bottom: 48, left: 52 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;

    const MAX_Y = 16;
    const MIN_Y = 0;

    function xPos(i)  { return pad.left + (i / (data.length - 1)) * cW; }
    function yPos(v)  { return pad.top + cH - ((v - MIN_Y) / (MAX_Y - MIN_Y)) * cH; }

    // --- Background zone fills ---
    const zones = [
      { start: 0, end: 5,  color: 'rgba(0,183,97,0.07)',   label: '안정', labelColor: '#00B761' },
      { start: 5, end: 11, color: 'rgba(232,45,45,0.07)',  label: '급등', labelColor: '#E82D2D' },
      { start: 11,end: 16, color: 'rgba(27,100,218,0.07)', label: '급락', labelColor: '#1B64DA' },
    ];

    zones.forEach(function (z) {
      const x1 = xPos(z.start);
      const x2 = z.end <= data.length - 1 ? xPos(z.end) : pad.left + cW;
      ctx.fillStyle = z.color;
      ctx.fillRect(x1, pad.top, x2 - x1, cH);

      // Zone label at top
      ctx.fillStyle = z.labelColor;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(z.label, (x1 + x2) / 2, pad.top - 12);
    });

    // --- Y-axis gridlines and labels ---
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8B95A1';
    ctx.font = '11px system-ui, sans-serif';

    [0, 4, 8, 12, 16].forEach(function (v) {
      const y = yPos(v);

      ctx.beginPath();
      ctx.strokeStyle = '#E5E8EB';
      ctx.lineWidth = 1;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cW, y);
      ctx.stroke();

      ctx.fillText(v + 's', pad.left - 8, y + 4);
    });

    // --- Event marker lines ---
    const events = [
      { idx: 5,  color: '#F5A523', label: '개인화 도입' },
      { idx: 11, color: '#00B761', label: '성능 최적화' },
    ];

    events.forEach(function (ev) {
      const x = xPos(ev.idx);
      ctx.beginPath();
      ctx.strokeStyle = ev.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + cH);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // --- Draw line ---
    ctx.beginPath();
    ctx.strokeStyle = '#1B64DA';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    data.forEach(function (v, i) {
      const x = xPos(i);
      const y = yPos(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // --- Data points (dots) ---
    data.forEach(function (v, i) {
      const x = xPos(i);
      const y = yPos(v);

      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#1B64DA';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Highlight peak point (Jan 10, index 9)
    const peakX = xPos(9);
    const peakY = yPos(data[9]);
    ctx.beginPath();
    ctx.arc(peakX, peakY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#E82D2D';
    ctx.fill();

    // Value label for peak
    ctx.fillStyle = '#E82D2D';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('14.2s', peakX, peakY - 10);

    // --- X-axis labels (every other date) ---
    ctx.fillStyle = '#8B95A1';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';

    [0, 2, 4, 5, 7, 9, 11, 13, 16].forEach(function (i) {
      const x = xPos(i);
      ctx.fillText(labels[i], x, pad.top + cH + 18);
    });

    // --- X-axis baseline ---
    ctx.beginPath();
    ctx.strokeStyle = '#E5E8EB';
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, pad.top + cH);
    ctx.lineTo(pad.left + cW, pad.top + cH);
    ctx.stroke();
  }

  /* ----------------------------------------------------------
     6. Run chart on load; re-draw on resize for responsiveness
  ---------------------------------------------------------- */
  function initChart() {
    drawLatencyChart();
  }

  // Draw after fonts / layout are settled
  if (document.readyState === 'complete') {
    initChart();
  } else {
    window.addEventListener('load', initChart);
  }

  // Redraw on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawLatencyChart, 200);
  });

  /* ----------------------------------------------------------
     7. Simple fade-in on scroll for finding cards
     Uses IntersectionObserver when available; no-ops otherwise.
  ---------------------------------------------------------- */
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Apply to finding cards and diff items
    document.querySelectorAll('.finding-card, .diff-item, .impact-card').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      observer.observe(el);
    });
  }

})();
