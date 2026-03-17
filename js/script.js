/* ============================================================
   North Florida Locksmith — Main JavaScript
   Vanilla JS, no dependencies, performance-first
   ============================================================ */

(function () {
  'use strict';

  /* ── Helpers ──────────────────────────────────────────────── */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  /* ── Sticky Header ────────────────────────────────────────── */
  const header = $('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile Navigation ────────────────────────────────────── */
  const navToggle = $('.nav-toggle');
  const mobileMenu = $('.mobile-menu');

  if (navToggle && mobileMenu) {
    const openMenu = () => {
      navToggle.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    };

    navToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    });

    /* Close when a link is tapped */
    $$('a', mobileMenu).forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    /* Close on Escape */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  /* ── Desktop Dropdowns ──────────────────────────────────────── */
  const dropdownItems = $$('.has-dropdown');

  dropdownItems.forEach(item => {
    const btn = item.querySelector('.nav-dropdown-btn');
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = item.classList.contains('open');
      dropdownItems.forEach(d => {
        d.classList.remove('open');
        d.querySelector('.nav-dropdown-btn')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', () => {
    dropdownItems.forEach(d => {
      d.classList.remove('open');
      d.querySelector('.nav-dropdown-btn')?.setAttribute('aria-expanded', 'false');
    });
  });

  /* ── Mobile Dropdowns ────────────────────────────────────────── */
  $$('.mobile-dropdown-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.mobile-has-dropdown');
      if (!item) return;
      const isOpen = item.classList.contains('open');
      $$('.mobile-has-dropdown').forEach(d => {
        d.classList.remove('open');
        d.querySelector('.mobile-dropdown-btn')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── Active Nav Link ──────────────────────────────────────── */
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  $$('.nav-list a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkPath = href.replace(/\/$/, '') || '/';
    if (
      linkPath === currentPath ||
      (linkPath !== '/' && currentPath.startsWith(linkPath))
    ) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ── FAQ Accordion ────────────────────────────────────────── */
  $$('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const answer = btn.nextElementSibling;

      /* Collapse all others in same list */
      const list = btn.closest('.faq-list');
      if (list) {
        $$('.faq-question', list).forEach(b => {
          b.setAttribute('aria-expanded', 'false');
          const ans = b.nextElementSibling;
          if (ans) ans.classList.remove('open');
        });
      }

      if (!expanded) {
        btn.setAttribute('aria-expanded', 'true');
        if (answer) answer.classList.add('open');
      }
    });
  });

  /* ── Smooth scroll for anchor links ─────────────────────────*/
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ── Lazy load images ─────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const imgObs = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        obs.unobserve(img);
      });
    }, { rootMargin: '200px' });

    $$('img[data-src]').forEach(img => imgObs.observe(img));
  } else {
    /* Fallback: load all */
    $$('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }

  /* ── Contact form basic submit handler ───────────────────── */
  const contactForm = $('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = contactForm.querySelector('[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending…';

      /* Simulate async — replace with real endpoint as needed */
      setTimeout(() => {
        const notice = document.createElement('p');
        notice.textContent = 'Thanks! We received your message and will call you shortly.';
        notice.style.cssText = 'margin-top:1rem;color:#16a34a;font-weight:700;';
        contactForm.appendChild(notice);
        contactForm.reset();
        btn.disabled = false;
        btn.textContent = originalText;
      }, 800);
    });
  }

})();
