// Theme persistence + nav interactions
(function () {
  const root = document.documentElement;
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = stored || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", initial);

  // --- DVH 3D logo mounting (uses CSS vars so it tracks the theme) ---
  const logos = [];                        // { handle, host, opts }
  function readThemeColors() {
    const style = getComputedStyle(root);
    // Fall back to library defaults if a var is missing.
    const accent = style.getPropertyValue('--accent').trim() || '#B87333';
    const ink    = style.getPropertyValue('--ink').trim()    || '#2B2520';
    return { accent, ink };
  }
  function mountAllLogos() {
    if (typeof DVHLogo === 'undefined') return;
    const { accent, ink } = readThemeColors();

    document.querySelectorAll('[data-dvh-logo]').forEach((host) => {
      const opts = {
        size:          parseInt(host.dataset.size || '220', 10),
        gridN:         parseInt(host.dataset.gridn || '5', 10),
        clusterRadius: parseFloat(host.dataset.cluster || '1.2'),
        speed:         parseFloat(host.dataset.speed || '1'),
        parallax:      host.dataset.parallax !== 'false',
        accent: accent,
        ink:    ink,
      };
      const handle = DVHLogo.mount(host, opts);
      logos.push({ handle, host, opts });
    });
  }
  function remountLogosForTheme() {
    if (typeof DVHLogo === 'undefined') return;
    const { accent, ink } = readThemeColors();
    logos.forEach((entry) => {
      try { entry.handle && entry.handle.destroy && entry.handle.destroy(); } catch (_) {}
      entry.opts.accent = accent;
      entry.opts.ink    = ink;
      // Clear host in case destroy() didn't.
      entry.host.innerHTML = '';
      entry.handle = DVHLogo.mount(entry.host, entry.opts);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    mountAllLogos();

    const btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.addEventListener("click", (e) => {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        const apply = () => {
          root.setAttribute("data-theme", next);
          localStorage.setItem("theme", next);
          // Re-colour logos after the theme vars have flipped.
          requestAnimationFrame(remountLogosForTheme);
        };

        // #4 — Theme crossfade. Circular reveal from the button's centre.
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const r = Math.hypot(
          Math.max(cx, window.innerWidth - cx),
          Math.max(cy, window.innerHeight - cy)
        );
        root.style.setProperty('--vt-x', cx + 'px');
        root.style.setProperty('--vt-y', cy + 'px');
        root.style.setProperty('--vt-r', r + 'px');

        if (document.startViewTransition &&
            !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          document.startViewTransition(apply);
        } else {
          apply();
        }
      });
    }

    const toggle = document.querySelector(".mobile-toggle");
    const links = document.querySelector(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", () => links.classList.toggle("open"));
    }

    // Mark active nav link based on filename
    const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const target = (a.getAttribute("href") || "").toLowerCase();
      if (target === here || (here === "" && target === "index.html")) {
        a.classList.add("active");
      }
    });

    // Any external link (http/https/mailto) opens in a new tab
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (/^(https?:|mailto:)/i.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // #2 — Word-by-word hero reveal
    const heroWordTargets = document.querySelectorAll(
      '.hero h1, .hero .tagline, .hero .bio, .research-hero h1, .research-hero > p'
    );
    const allWordSpans = [];
    heroWordTargets.forEach((node) => splitIntoWords(node, allWordSpans));

    if (reduced) {
      allWordSpans.forEach((s) => s.classList.add('in'));
    } else {
      // stagger — quick for h1, slower/softer for bio
      const step = 28;         // ms per word
      const ceiling = 1400;    // clamp so long paragraphs don't drag
      allWordSpans.forEach((span, i) => {
        const delay = Math.min(i * step, ceiling);
        span.style.transitionDelay = delay + 'ms';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => span.classList.add('in'));
        });
      });
    }

    // #3 — Scroll-reveal everything except the hero(es) handled by word-reveal
    const revealTargets = document.querySelectorAll(
      'main section:not(.hero):not(.research-hero)'
    );
    revealTargets.forEach((el) => el.classList.add('reveal'));

    if (reduced || !('IntersectionObserver' in window)) {
      revealTargets.forEach((el) => el.classList.add('in-view'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
      );
      revealTargets.forEach((el) => io.observe(el));
    }

    // #7 — Triad graph interactions
    document.querySelectorAll('.triad .node').forEach((n) => {
      const graph = n.closest('.triad');
      const id = n.getAttribute('data-id');
      n.addEventListener('mouseenter', () => graph.setAttribute('data-active', id));
      n.addEventListener('mouseleave', () => graph.removeAttribute('data-active'));
      n.addEventListener('focus',      () => graph.setAttribute('data-active', id));
      n.addEventListener('blur',       () => graph.removeAttribute('data-active'));
    });

  });

  // Walk DOM, wrap each word in a <span class="reveal-word">.
  // Preserves existing inline elements (links, <em>, <strong>, ...).
  function splitIntoWords(root, bag) {
    const toVisit = [...root.childNodes];
    toVisit.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.nodeValue;
        if (!text || !text.trim()) return;
        const frag = document.createDocumentFragment();
        const tokens = text.split(/(\s+)/);
        tokens.forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) {
            frag.appendChild(document.createTextNode(tok));
          } else {
            const span = document.createElement('span');
            span.className = 'reveal-word';
            span.textContent = tok;
            bag.push(span);
            frag.appendChild(span);
          }
        });
        child.parentNode.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        splitIntoWords(child, bag);
      }
    });
  }
})();
