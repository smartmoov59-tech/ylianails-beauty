/* ==========================================================
   YliaNails Beauty — interactions & motion design
   GSAP + ScrollTrigger + Lenis (copies locales, aucun service tiers)
   ========================================================== */
(() => {
  'use strict';

  const doc = document.documentElement;
  const body = document.body;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const PHONE = '+33689409759';

  let lenis = null;

  /* ------------------------------------------------------
     Fonctions sans animation (toujours actives)
     ------------------------------------------------------ */
  function initMenu() {
    const burger = $('.burger');
    const menu = $('#menu');
    if (!burger || !menu) return;
    const set = (open) => {
      body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      menu.setAttribute('aria-hidden', String(!open));
      if (lenis) { open ? lenis.stop() : lenis.start(); }
      else { body.style.overflow = open ? 'hidden' : ''; }
    };
    burger.addEventListener('click', () => set(!body.classList.contains('menu-open')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) { set(false); burger.focus(); }
    });
  }

  function refreshLater() {
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 750);
  }

  function initAccordion() {
    const btns = $$('.acc__q');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btns.forEach((b) => b.setAttribute('aria-expanded', 'false'));
        btn.setAttribute('aria-expanded', String(!open));
        refreshLater();
      });
    });
  }

  function initRows() {
    $$('.row').forEach((row) => {
      const btn = $('.row__btn', row);
      btn.addEventListener('click', () => {
        const open = !row.classList.contains('is-open');
        row.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        refreshLater();
      });
    });
  }

  function initConfigurator() {
    const form = $('#cfg');
    if (!form) return;
    const boxes = $$('input[type="checkbox"]', form);
    const totalEl = $('#cfgTotal');
    const timeEl = $('#cfgTime');
    const lines = $('#cfgLines');
    const sms = $('#cfgSms');
    const hint = $('#cfgHint');
    const name = $('#cfgName');
    const when = $('#cfgWhen');

    const fmt = (m) => {
      const h = Math.floor(m / 60), r = m % 60;
      return h ? (r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`) : `${r} min`;
    };

    const update = () => {
      const sel = boxes.filter((b) => b.checked);
      const total = sel.reduce((s, b) => s + Number(b.dataset.price), 0);
      const mins = sel.reduce((s, b) => s + Number(b.dataset.min), 0);
      totalEl.textContent = total + ' €';
      timeEl.textContent = sel.length ? '≈ ' + fmt(mins) : '—';

      lines.textContent = '';
      if (!sel.length) {
        const li = document.createElement('li');
        li.className = 'ticket__empty';
        li.textContent = 'Aucune prestation sélectionnée';
        lines.appendChild(li);
      } else {
        sel.forEach((b) => {
          const li = document.createElement('li');
          const a = document.createElement('span');
          const dots = document.createElement('i');
          const p = document.createElement('b');
          a.textContent = b.value;
          p.textContent = b.dataset.price + ' €';
          li.append(a, dots, p);
          lines.appendChild(li);
        });
      }

      const prenom = name.value.trim();
      const dispo = when.value.trim();
      const msg =
        'Bonjour Yliana, ' + (prenom ? 'c’est ' + prenom + '. ' : '') +
        'Je souhaite réserver : ' + sel.map((b) => b.value).join(', ') + '. ' +
        'Total estimé : ' + total + ' € (≈ ' + fmt(mins) + ').' +
        (dispo ? ' Mes disponibilités : ' + dispo + '.' : '') + ' Merci !';

      sms.href = sel.length ? 'sms:' + PHONE + '?&body=' + encodeURIComponent(msg) : 'sms:' + PHONE;
      sms.setAttribute('aria-disabled', String(!sel.length));
      hint.classList.remove('is-warn');
      hint.textContent = sel.length
        ? 'Votre SMS est prêt : il s’ouvre dans votre messagerie, il ne reste qu’à l’envoyer.'
        : 'Sélectionnez au moins une prestation pour préparer votre SMS.';
    };

    form.addEventListener('input', update);
    form.addEventListener('change', update);
    sms.addEventListener('click', (e) => {
      if (sms.getAttribute('aria-disabled') === 'true') {
        e.preventDefault();
        hint.classList.add('is-warn');
        hint.textContent = 'Choisissez d’abord au moins une prestation.';
      }
    });
    update();
  }

  function initOpenNow() {
    const status = $('#openNow');
    const rows = $$('#hours li');
    if (!status) return;
    const label = $('span', status);
    const paris = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const update = () => {
      const d = paris();
      const day = d.getDay();
      const mins = d.getHours() * 60 + d.getMinutes();
      rows.forEach((r) => r.classList.toggle('is-today', Number(r.dataset.day) === day));
      const workday = day >= 1 && day <= 6;
      if (workday && mins >= 540 && mins < 990) {
        status.classList.add('is-open');
        label.textContent = 'Ouvert maintenant · jusqu’à 16 h 30';
      } else {
        status.classList.remove('is-open');
        let when = 'demain à 9 h 00';
        if (workday && mins < 540) when = 'aujourd’hui à 9 h 00';
        else if (day === 6) when = 'lundi à 9 h 00';
        label.textContent = 'Fermé · ouvre ' + when;
      }
    };
    update();
    setInterval(update, 60000);
  }

  /* pile de cartes d'avis */
  function initReviews() {
    const stack = $('.rv-stack');
    if (!stack) return;
    const cards = $$('.rv', stack);
    const n = cards.length;
    const countEl = $('.reviews__count b');
    const section = $('#avis');
    let order = cards.map((_, i) => i);
    let busy = false;
    let timer = null;

    const render = () => {
      order.forEach((ci, pos) => {
        cards[ci].dataset.pos = String(pos);
        cards[ci].setAttribute('aria-hidden', String(pos !== 0));
      });
      countEl.textContent = String(order[0] + 1);
    };
    const settle = (card, delay) => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        card.classList.remove('snap', 'is-leaving');
        setTimeout(() => { busy = false; }, delay);
      }));
    };
    const next = () => {
      if (busy) return;
      busy = true;
      const front = cards[order[0]];
      front.classList.add('is-leaving');
      setTimeout(() => {
        order.push(order.shift());
        front.classList.add('snap');
        front.classList.remove('is-leaving');
        render();
        requestAnimationFrame(() => requestAnimationFrame(() => {
          front.classList.remove('snap');
          busy = false;
        }));
      }, 480);
    };
    const prev = () => {
      if (busy) return;
      busy = true;
      const card = cards[order[n - 1]];
      card.classList.add('snap', 'is-leaving');
      order.unshift(order.pop());
      render();
      settle(card, 700);
    };
    const stop = () => { clearInterval(timer); };
    const play = () => { if (reduce) return; stop(); timer = setInterval(next, 7500); };

    $$('.reviews__ctrl .round').forEach((b) => b.addEventListener('click', () => {
      Number(b.dataset.dir) > 0 ? next() : prev();
      play();
    }));
    stack.addEventListener('click', (e) => { if (e.target.closest('.rv[data-pos="0"]')) { next(); play(); } });

    let sx = 0, dx = 0, drag = false;
    stack.addEventListener('pointerdown', (e) => { drag = true; sx = e.clientX; dx = 0; });
    stack.addEventListener('pointermove', (e) => { if (drag) dx = e.clientX - sx; });
    const end = () => {
      if (!drag) return;
      drag = false;
      if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); play(); }
    };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => stack.addEventListener(ev, end));

    section.addEventListener('mouseenter', stop);
    section.addEventListener('mouseleave', play);
    section.addEventListener('focusin', stop);
    section.addEventListener('focusout', play);
    new IntersectionObserver((es) => { es[0].isIntersecting ? play() : stop(); }, { threshold: 0.3 }).observe(section);
    render();
  }

  function initVideos() {
    const videos = $$('video');
    if (reduce) {
      videos.forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
      return;
    }
    const tryPlay = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { e.isIntersecting ? tryPlay(e.target) : e.target.pause(); });
    }, { threshold: 0.1 });
    videos.forEach((v) => io.observe(v));
  }

  /* ------------------------------------------------------
     Découpage de texte
     ------------------------------------------------------ */
  function splitEl(el, mode) {
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const chars = [];
    const walk = (node, parent) => {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { parent.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.setAttribute('aria-hidden', 'true');
            if (mode === 'chars') {
              Array.from(p).forEach((ch) => {
                const c = document.createElement('span');
                c.className = 'c';
                c.textContent = ch;
                w.appendChild(c);
                chars.push(c);
              });
            } else {
              const c = document.createElement('span');
              c.className = 'c';
              c.textContent = p;
              w.appendChild(c);
              chars.push(c);
            }
            parent.appendChild(w);
          });
        } else if (n.nodeType === 1) {
          if (n.tagName === 'BR') { parent.appendChild(n.cloneNode()); return; }
          const clone = n.cloneNode(false);
          parent.appendChild(clone);
          walk(n, clone);
        }
      });
    };
    const frag = document.createDocumentFragment();
    walk(el, frag);
    el.textContent = '';
    el.appendChild(frag);
    return chars;
  }

  /* ------------------------------------------------------
     Animations (GSAP + ScrollTrigger + Lenis)
     ------------------------------------------------------ */
  function animate() {
    doc.classList.add('anim');
    gsap.registerPlugin(ScrollTrigger);
    gsap.config({ nullTargetWarn: false });

    /* --- smooth scroll --- */
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    /* --- rail de progression : une marguerite qui descend --- */
    const rail = $('.rail');
    const thumb = $('.rail__thumb');
    gsap.to('.rail i', { scaleY: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.15 } });
    gsap.to(thumb, { y: () => rail.clientHeight, rotate: 900, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.15, invalidateOnRefresh: true } });

    /* --- curseur marguerite --- */
    if (fine) {
      const cur = document.createElement('div');
      cur.className = 'cursor is-on';
      cur.setAttribute('aria-hidden', 'true');
      cur.innerHTML = '<svg><use href="#daisy"/></svg>';
      body.appendChild(cur);
      const flower = $('svg', cur);
      const xt = gsap.quickTo(cur, 'x', { duration: 0.3, ease: 'power3' });
      const yt = gsap.quickTo(cur, 'y', { duration: 0.3, ease: 'power3' });
      const rt = gsap.quickTo(flower, 'rotation', { duration: 0.8, ease: 'power3' });
      addEventListener('pointermove', (e) => { xt(e.clientX); yt(e.clientY); rt(e.clientX * 0.5); }, { passive: true });
      document.addEventListener('pointerover', (e) => {
        const on = !!(e.target.closest && e.target.closest('a,button,label,input,.rv'));
        gsap.to(flower, { scale: on ? 1.9 : 1, duration: 0.45, ease: 'power3' });
      });
    }

    /* --- découpage de texte avant de mesurer quoi que ce soit --- */
    const heroChars = $$('.hero__word').flatMap((el) => splitEl(el, 'chars'));
    const splitTargets = $$('[data-split]').map((el) => ({ el, chars: splitEl(el, el.dataset.split) }));
    const footChars = splitEl($('[data-footsplit]'), 'chars');

    /* ============ INTRO HERO + LOADER NUANCIER ============ */
    const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    heroTl
      .from(heroChars, { yPercent: 120, rotate: 6, duration: 1.5, stagger: 0.05 }, 0)
      .from('.hero__chip', { y: -24, opacity: 0, duration: 1 }, 0.1)
      .from('.hero__media', { y: 100, opacity: 0, duration: 1.6 }, 0.1)
      .from('.hero__row > *', { y: 40, opacity: 0, duration: 1.1, stagger: 0.1 }, 0.5)
      .from('.nav', { yPercent: -170, duration: 1.1, clearProps: 'transform' }, 0.5)
      .from('.hero__decor .orb, .hero__decor .dz', { scale: 0, rotate: -90, opacity: 0, duration: 1.4, stagger: 0.08, ease: 'back.out(1.6)' }, 0.6);

    const loader = $('.loader');
    const finishLoader = () => {
      if (loader) loader.remove();
      body.classList.remove('is-loading');
      lenis.start();
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    };
    if (loader) {
      const bars = $$('.loader__bars i', loader);
      const name = $$('.loader__name > *', loader);
      gsap.set(bars, { scaleY: 0 });
      gsap.timeline()
        .to(bars, { scaleY: 1, duration: 0.8, ease: 'power3.out', stagger: 0.09 })
        .from(name, { yPercent: 125, duration: 0.8, ease: 'expo.out', stagger: 0.1 }, 0.35)
        .to(name, { yPercent: -125, duration: 0.5, ease: 'power3.in' }, 1.5)
        .set(loader, { backgroundColor: 'rgba(246,242,236,0)' }, 1.65)
        .to(bars, { yPercent: -101, duration: 0.95, ease: 'expo.inOut', stagger: { each: 0.07 } }, 1.65)
        .add(() => heroTl.play(), 2)
        .add(finishLoader, 3.1);
    } else {
      heroTl.play();
      finishLoader();
    }

    /* ============ NAV / DOCK ============ */
    const nav = $('#nav');
    const dock = $('.dock');
    let hidden = false;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        const h = self.direction === 1 && y > 260 && !body.classList.contains('menu-open');
        if (h !== hidden) { hidden = h; gsap.to(nav, { yPercent: h ? -170 : 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' }); }
      },
    });
    if (dock) {
      ScrollTrigger.create({
        trigger: '.about', start: 'top 85%',
        onEnter: () => dock.classList.add('is-on'),
        onLeaveBack: () => dock.classList.remove('is-on'),
      });
    }

    /* ============ HERO : la capsule s'ouvre au scroll ============ */
    (() => {
      const sticky = $('.hero__sticky');
      const media = $('.hero__media');
      const slot = $('.hero__slot');
      // capsule de départ = emplacement du « trou » entre Ylia et Nails ; on interpole nous-mêmes les valeurs
      let from = { t: 0, r: 0, b: 0, l: 0, rad: 0 };
      const prog = { p: 0 };
      const measure = () => {
        const s = sticky.getBoundingClientRect();
        const r = slot.getBoundingClientRect();
        from = { t: r.top - s.top, r: s.right - r.right, b: s.bottom - r.bottom, l: r.left - s.left, rad: Math.min(r.width, r.height) / 2 };
      };
      const apply = (p) => {
        const k = 1 - p;
        media.style.clipPath = `inset(${(from.t * k).toFixed(1)}px ${(from.r * k).toFixed(1)}px ${(from.b * k).toFixed(1)}px ${(from.l * k).toFixed(1)}px round ${(from.rad * k).toFixed(1)}px)`;
      };
      measure();
      apply(0);
      ScrollTrigger.addEventListener('refreshInit', () => { measure(); apply(prog.p); });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=160%', pin: '.hero__sticky', scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1 },
      });
      tl.to(prog, { p: 1, ease: 'power2.inOut', duration: 1, onUpdate: () => apply(prog.p) }, 0)
        .to('.hero__word--l', { xPercent: -130, ease: 'power2.in', duration: 0.85 }, 0)
        .to('.hero__word--r', { xPercent: 130, ease: 'power2.in', duration: 0.85 }, 0)
        .to('.hero__chip', { y: -30, opacity: 0, duration: 0.4 }, 0)
        .to('.hero__row', { y: 70, opacity: 0, duration: 0.45 }, 0)
        .to('.hero__decor', { opacity: 0, duration: 0.5 }, 0.05)
        .to('.hero__video', { scale: 1.14, duration: 1.2 }, 0)
        .to('.hero__veil', { opacity: 1, duration: 0.6 }, 0.4)
        .to('.hero__over', { opacity: 1, duration: 0.4 }, 0.72)
        .to({}, { duration: 0.4 });

      $$('.hero__decor .orb, .hero__decor .dz').forEach((el) => {
        gsap.to(el, { y: () => -Number(el.dataset.speed || 0.5) * 220, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=160%', scrub: true } });
      });
      if (fine) {
        const movers = $$('.hero__decor .orb, .hero__decor .dz').map((el) => ({ k: Number(el.dataset.speed || 0.5), x: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3' }) }));
        sticky.addEventListener('pointermove', (e) => {
          const nx = e.clientX / innerWidth - 0.5;
          movers.forEach((m) => m.x(-nx * 90 * m.k));
        });
      }
    })();

    /* ============ TICKER : deux lignes, vitesse + inclinaison au scroll ============ */
    (() => {
      const rows = $$('.ticker__row').map((row) => {
        const track = $('.ticker__track', row);
        const base = track.innerHTML;
        const per = track.children.length;
        const copies = Math.max(2, Math.ceil((innerWidth * 2.2) / Math.max(track.scrollWidth, 400)) + 1);
        track.innerHTML = base.repeat(copies);
        const measure = () => track.children[per].offsetLeft - track.children[0].offsetLeft;
        return { track, per, dir: Number(row.dataset.dir), x: 0, dist: measure(), measure };
      });
      let flow = 1, boost = 0, skew = 0, targetSkew = 0;
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
          flow = self.direction === 1 ? 1 : -1;
          const v = self.getVelocity();
          boost = Math.min(Math.abs(v) / 240, 16);
          targetSkew = Math.max(-9, Math.min(9, -v / 260));
        },
      });
      addEventListener('resize', () => rows.forEach((r) => { r.dist = r.measure(); }));
      gsap.ticker.add((time, delta) => {
        const f = delta / 16.67;
        boost *= Math.pow(0.92, f);
        targetSkew *= Math.pow(0.9, f);
        skew += (targetSkew - skew) * Math.min(1, 0.14 * f);
        rows.forEach((r) => {
          r.x += r.dir * flow * (1.2 + boost) * f;
          if (r.x <= -r.dist) r.x += r.dist;
          if (r.x > 0) r.x -= r.dist;
          r.track.style.transform = `translate3d(${r.x}px,0,0) skewX(${(skew * r.dir * -1).toFixed(2)}deg)`;
        });
      });
    })();

    /* ============ SAVOIR-FAIRE : 4 étapes visibles d'un coup ============ */
    gsap.from('.step', { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.steps', start: 'top 85%', once: true } });
    $$('.step__media img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom 35%', scrub: true } });
    });

    /* ============ TARIFS : aperçu qui suit le curseur ============ */
    if (fine) {
      const peek = $('.peek');
      const img = $('img', peek);
      const rows = $$('.row');
      gsap.set(peek, { xPercent: 0, scale: 0.6, rotate: -8 });
      const px = gsap.quickTo(peek, 'x', { duration: 0.55, ease: 'power3' });
      const py = gsap.quickTo(peek, 'y', { duration: 0.55, ease: 'power3' });
      rows.forEach((row) => {
        row.addEventListener('pointerenter', (e) => {
          img.src = row.dataset.img;
          px(e.clientX + 36); py(e.clientY - 150);
          gsap.to(peek, { opacity: 1, scale: 1, rotate: -4, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
        });
        row.addEventListener('pointermove', (e) => { px(e.clientX + 36); py(e.clientY - 150); });
        row.addEventListener('pointerleave', () => {
          gsap.to(peek, { opacity: 0, scale: 0.6, rotate: -8, duration: 0.4, ease: 'power3.in', overwrite: 'auto' });
        });
      });
    }

    /* ============ CHIFFRES : bento ============ */
    gsap.from('.tile', {
      y: 90, scale: 0.84, opacity: 0, rotate: () => gsap.utils.random(-6, 6), duration: 1.3, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: '.bento__grid', start: 'top 82%', once: true },
    });
    $$('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || '0', 10);
      const o = { v: 0 };
      el.textContent = (0).toFixed(dec).replace('.', ',');
      gsap.to(o, {
        v: end, duration: 2.4, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = o.v.toFixed(dec).replace('.', ','); },
      });
    });
    gsap.to('.orb--tile', { y: 80, rotate: 120, ease: 'none', scrollTrigger: { trigger: '.bento', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.tile--e img', { scale: 1.5, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: '.tile--e', start: 'top 88%', once: true } });

    /* ============ GALERIE : cartes empilées ============ */
    const cards = $$('.scard');
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      const img = $('img', c);
      gsap.fromTo(img, { scale: 1.22 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'top 14%', scrub: true } });
      if (next) {
        const st = { trigger: next, start: 'top 92%', end: 'top 12%', scrub: true };
        gsap.to(c, { scale: 0.9, rotate: (i % 2 ? 1 : -1) * 1.8, ease: 'none', scrollTrigger: st });
        gsap.to($('.scard__dim', c), { opacity: 0.5, ease: 'none', scrollTrigger: st });
      }
    });

    /* ============ RÉSERVATION / CONTACT / FOOTER ============ */
    gsap.from('.cfg', { y: 90, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.cfg', start: 'top 88%', once: true } });
    gsap.from('.chips .chip', { y: 22, opacity: 0, duration: 0.9, stagger: 0.04, ease: 'power3.out', scrollTrigger: { trigger: '.cfg__group', start: 'top 85%', once: true } });
    gsap.from('.acc', { y: 30, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.faq', start: 'top 88%', once: true } });
    gsap.fromTo('.find__map', { clipPath: 'inset(100% 0% 0% 0% round 44px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 44px)', duration: 1.6, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.find__map', start: 'top 88%', once: true },
      onComplete: () => gsap.set('.find__map', { clearProps: 'clipPath' }),
    });
    gsap.from('.find__card', { y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.find__card', start: 'top 90%', once: true } });
    gsap.from(footChars, { yPercent: 115, duration: 1.5, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: '.foot__cta', start: 'top 92%', once: true } });
    gsap.from('.foot__cta-a', { scale: 0, rotate: -180, duration: 1.4, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.foot__cta', start: 'top 92%', once: true } });

    /* ============ TEXTES : split au scroll, fondus ============ */
    splitTargets.forEach(({ el, chars }) => {
      gsap.from(chars, {
        yPercent: 118, rotate: 4, duration: 1.3, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
    $$('[data-fade]').forEach((el) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });

    /* ============ IMAGES : rideau + parallax interne ============ */
    $$('.reveal').forEach((el) => {
      const cover = document.createElement('span');
      cover.className = 'cover';
      el.appendChild(cover);
      gsap.to(cover, { scaleY: 0, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-parallax]').forEach((img) => {
      gsap.set(img, { scale: 1.2 });
      gsap.fromTo(img, { yPercent: -7 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    /* ============ MICRO-INTERACTIONS ============ */
    if (fine) {
      $$('.tilt, .scard__img').forEach((el) => {
        gsap.set(el, { transformPerspective: 900 });
        const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
        const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          ry((px - 0.5) * 10);
          rx((0.5 - py) * 10);
          el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        });
        el.addEventListener('pointerleave', () => { rx(0); ry(0); });
      });

      $$('.magnetic').forEach((el) => {
        const inner = el.classList.contains('btn') ? el.firstElementChild : null;
        const cfg = { duration: 0.7, ease: 'elastic.out(1,0.55)' };
        const xt = gsap.quickTo(el, 'x', cfg), yt = gsap.quickTo(el, 'y', cfg);
        const ix = inner ? gsap.quickTo(inner, 'x', cfg) : null;
        const iy = inner ? gsap.quickTo(inner, 'y', cfg) : null;
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          xt(dx * 0.3); yt(dy * 0.4);
          if (ix) { ix(dx * 0.12); iy(dy * 0.15); }
        });
        el.addEventListener('pointerleave', () => { xt(0); yt(0); if (ix) { ix(0); iy(0); } });
      });
    }

    /* ============ ANCRES : défilement fluide ============ */
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        const t = $(id);
        if (!t) return;
        e.preventDefault();
        const target = t.parentElement && t.parentElement.classList.contains('pin-spacer') ? t.parentElement : t;
        lenis.scrollTo(target, { offset: 0, duration: 1.5, force: true });
      });
    });

    /* ============ recalcul après chargement des polices / images ============ */
    const refresh = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    addEventListener('load', refresh);
  }

  /* ------------------------------------------------------
     Démarrage
     ------------------------------------------------------ */
  initMenu();
  initAccordion();
  initRows();
  initConfigurator();
  initOpenNow();
  initReviews();
  initVideos();

  const fallback = () => {
    doc.classList.remove('anim');
    const l = $('.loader');
    if (l) l.remove();
    body.classList.remove('is-loading');
    const d = $('.dock');
    if (d) d.classList.add('is-on');
  };

  if (hasGSAP && !reduce) {
    try {
      animate();
    } catch (err) {
      console.error('[YliaNails] animations désactivées :', err);
      if (lenis) { try { lenis.destroy(); } catch (e) { /* noop */ } lenis = null; }
      fallback();
    }
  } else {
    fallback();
  }
})();
