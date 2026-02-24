/* ===================================================
   FATE/STAY LAST TIME — INTERACTIVE ENGINE v2.1
   Modern ES2024 · RAF Delta · Async Sequences
   Single Observer Pool · Passive Scroll
   =================================================== */

;(() => {
    'use strict';

    // ─── Constants ───
    const STORAGE_KEY    = 'fate-theme';
    const PARTICLE_COUNT = 35;
    const LOADER_DELAY   = 1200;
    const TYPE_SPEED     = 30;

    // ─── Utilities ───
    const $    = (sel, ctx = document) => ctx.querySelector(sel);
    const $$   = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const rand  = (lo = 0, hi = 1) => Math.random() * (hi - lo) + lo;
    const pick  = arr => arr[Math.floor(Math.random() * arr.length)];

    const prefersReducedMotion =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Callbacks that run when theme changes
    const themeChangeCallbacks = [];

    // ═══════════════════════════════════════════════
    //  1. THEME ENGINE
    // ═══════════════════════════════════════════════
    const Theme = (() => {
        const toggle = $('.theme-toggle');
        let current = localStorage.getItem(STORAGE_KEY) ?? 'void';

        const apply = theme => {
            current = theme;
            document.body.classList.remove('theme-void', 'theme-avalon');
            document.body.classList.add(`theme-${theme}`);
            localStorage.setItem(STORAGE_KEY, theme);
            toggle?.setAttribute('data-tooltip',
                theme === 'void' ? 'Switch to Avalon' : 'Switch to Void'
            );

            // Notify subscribers after CSS recalculates
            requestAnimationFrame(() => {
                themeChangeCallbacks.forEach(fn => fn(theme));
            });
        };

        apply(current);

        toggle?.addEventListener('click', () =>
            apply(current === 'void' ? 'avalon' : 'void')
        );

        return { get current() { return current; } };
    })();

    // ═══════════════════════════════════════════════
    //  2. LOADING SCREEN
    // ═══════════════════════════════════════════════
    const loader = $('.summoning-loader');
    if (loader) {
        const dismiss = async () => {
            await wait(LOADER_DELAY);
            loader.classList.add('hidden');
        };

        if (document.readyState === 'complete') {
            dismiss();
        } else {
            window.addEventListener('load', dismiss, { once: true });
        }
    }

    // ═══════════════════════════════════════════════
    //  3. SCROLL PROGRESS (Command Seal)
    // ═══════════════════════════════════════════════
    const progressBar = $('.command-seal-progress');
    if (progressBar) {
        let ticking = false;

        const updateProgress = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            const pct = scrollHeight <= clientHeight
                ? 0
                : (scrollTop / (scrollHeight - clientHeight)) * 100;
            progressBar.style.height = `${pct}%`;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateProgress);
                ticking = true;
            }
        }, { passive: true });
    }

    // ═══════════════════════════════════════════════
    //  4. PRANA PARTICLE SYSTEM
    // ═══════════════════════════════════════════════
    const canvas = $('#prana-particles');

    if (canvas) {
        const ctx = canvas.getContext('2d', { alpha: true });
        let W = 0;
        let H = 0;

        // ── Resize: only when dimensions actually change ──
        const resizeCanvas = () => {
            const newW = window.innerWidth;
            const newH = window.innerHeight;

            // Guard: skip if nothing changed (prevents buffer clear flicker)
            if (newW === W && newH === H) return;

            W = canvas.width  = newW;
            H = canvas.height = newH;
        };

        resizeCanvas();

        // Debounced resize — no need to fire on every pixel of window drag
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resizeCanvas, 100);
        }, { passive: true });

        // ── Theme-aware colors ──
        const readColors = () => {
            const s = getComputedStyle(document.body);
            const c = prefix => ({
                r: parseInt(s.getPropertyValue(`--particle-${prefix}-r`)) || 0,
                g: parseInt(s.getPropertyValue(`--particle-${prefix}-g`)) || 0,
                b: parseInt(s.getPropertyValue(`--particle-${prefix}-b`)) || 0,
            });
            return [c('1'), c('2'), c('3')];
        };

        let palette = readColors();

        // Re-read palette when theme changes (via callback, not monkey-patch)
        themeChangeCallbacks.push(() => {
            palette = readColors();
            pool.forEach(p => { p.color = pick(palette); });
        });

        // ── Object Pool ──
        const createParticle = () => ({
            x: rand(0, W || innerWidth),
            y: rand(0, H || innerHeight),
            size: rand(0.5, 3),
            vx: rand(-0.15, 0.15),
            vy: rand(-0.4, -0.1),
            opacity: rand(0.1, 0.4),
            fadeSpeed: rand(0.001, 0.004),
            growing: true,
            color: pick(palette),
        });

        const pool = Array.from({ length: PARTICLE_COUNT }, createParticle);

        const resetParticle = p => {
            p.x = rand(0, W);
            p.y = rand(H * 0.3, H);
            p.size = rand(0.5, 3);
            p.vx = rand(-0.15, 0.15);
            p.vy = rand(-0.4, -0.1);
            p.opacity = 0.05;
            p.fadeSpeed = rand(0.001, 0.004);
            p.growing = true;
            p.color = pick(palette);
        };

        // ── Render Loop (delta-time) ──
        let lastTime = performance.now();

        const tick = now => {
            const dt = clamp((now - lastTime) / 16.667, 0.1, 3);
            lastTime = now;

            ctx.clearRect(0, 0, W, H);

            for (const p of pool) {
                // Physics
                p.x += p.vx * dt;
                p.y += p.vy * dt;

                // Fade cycle
                if (p.growing) {
                    p.opacity += p.fadeSpeed * dt;
                    if (p.opacity >= 0.5) p.growing = false;
                } else {
                    p.opacity -= p.fadeSpeed * dt;
                    if (p.opacity <= 0) { resetParticle(p); continue; }
                }

                // Bounds check
                if (p.y < -10 || p.x < -10 || p.x > W + 10) {
                    resetParticle(p);
                    continue;
                }

                const { r, g, b } = p.color;
                const a = clamp(p.opacity, 0, 1);

                // Glow halo
                ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.15})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, 6.2832);
                ctx.fill();

                // Core dot
                ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, 6.2832);
                ctx.fill();
            }

            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }

    // ═══════════════════════════════════════════════
    //  5. INTERSECTION OBSERVER HELPERS
    // ═══════════════════════════════════════════════
    const observeOnce = (elements, callback, options = {}) => {
        if (!elements.length) return;

        const observer = new IntersectionObserver((entries, obs) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    obs.unobserve(entry.target);
                }
            }
        }, { threshold: 0.5, ...options });

        elements.forEach(el => observer.observe(el));
        return observer;
    };

    const observeLive = (elements, callback, options = {}) => {
        if (!elements.length) return;

        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                callback(entry.target, entry.isIntersecting);
            }
        }, { threshold: 0.3, ...options });

        elements.forEach(el => observer.observe(el));
        return observer;
    };

    // ── Sound Effect Shake ──
    observeOnce($$('.sound-effect'), async el => {
        el.classList.add('shake');
        await wait(500);
        el.classList.remove('shake');
    }, { threshold: 0.8 });

    // ── Incantation Typing ──
    observeOnce($$('.incantation[data-typed]'), el => {
        typewriter(el);
    }, { threshold: 0.5 });

    // ── Hour Tracker Dots ──
    const hourHeadings = $$('.hour-heading');
    const hourDots     = $$('.hour-dot');

    if (hourHeadings.length && hourDots.length) {
        observeLive(hourHeadings, (target, isVisible) => {
            if (!isVisible) return;

            const idx = hourHeadings.indexOf(target);
            if (idx < 0) return;

            hourDots.forEach((dot, i) => {
                dot.classList.toggle('active', i <= idx);
                dot.classList.toggle('current', i === idx);
            });
        }, { threshold: 0.3 });
    }

    // ═══════════════════════════════════════════════
    //  6. INCANTATION TYPEWRITER
    // ═══════════════════════════════════════════════
    function typewriter(element) {
        const source = element.innerHTML;
        element.innerHTML = '';
        element.style.visibility = 'visible';

        let cursor = 0;
        let buffer = '';

        const step = () => {
            if (cursor >= source.length) return;

            if (source[cursor] === '<') {
                const close = source.indexOf('>', cursor);
                buffer += source.substring(cursor, close + 1);
                cursor = close + 1;
            } else {
                buffer += source[cursor++];
            }

            element.innerHTML = buffer;
            setTimeout(step, TYPE_SPEED);
        };

        step();
    }

    // ═══════════════════════════════════════════════
    //  7. REALITY MARBLE — FORGE REVEAL
    // ═══════════════════════════════════════════════
    const rmDeclare = $('.reality-marble-declare');

    if (rmDeclare) {
        const rmTitle = rmDeclare.querySelector('.rm-title');
        const rmFlash = rmDeclare.querySelector('.rm-flash-overlay');
        const rmText  = rmTitle?.getAttribute('data-rm-text');

        // Split text into character spans (single DOM write via fragment)
        if (rmTitle && rmText) {
            const frag = document.createDocumentFragment();
            let ci = 0;

            for (const ch of rmText) {
                if (ch === ' ') {
                    const space = document.createElement('span');
                    space.className = 'rm-space';
                    frag.appendChild(space);
                } else {
                    const span = document.createElement('span');
                    span.className = 'rm-char';
                    span.textContent = ch;
                    span.style.setProperty('--i', ci++);
                    frag.appendChild(span);
                }
            }

            rmTitle.innerHTML = '';
            rmTitle.appendChild(frag);
        }

        // Trigger on scroll
        observeOnce([rmDeclare], el => {
            if (prefersReducedMotion) {
                el.classList.add('rm-active', 'rm-complete');
                el.querySelectorAll('.rm-char').forEach(c => {
                    c.style.opacity = '1';
                    c.style.transform = 'none';
                });
            } else {
                forgeSequence(el);
            }
        }, { threshold: 0.4 });

        // Async choreography
        async function forgeSequence(el) {
            const chars    = el.querySelectorAll('.rm-char');
            const total    = chars.length;
            const STAGGER  = 70;
            const CHAR_DUR = 500;
            const BUILDUP  = 400;
            const FORGE_END  = BUILDUP + ((total - 1) * STAGGER) + CHAR_DUR;
            const FLASH_AT   = FORGE_END + 200;
            const COMPLETE_AT = FLASH_AT + 600;

            // Phase 0 — Atmosphere
            el.classList.add('rm-active');

            // Phase 1 — Tremor
            await wait(100);
            el.classList.add('rm-shake-tremor');

            // Phase 2 — Forge letters
            await wait(BUILDUP - 100);
            chars.forEach(c => c.classList.add('rm-forged'));

            // End tremor before impact
            await wait(FLASH_AT - BUILDUP - 100);
            el.classList.remove('rm-shake-tremor');

            // Phase 3 — Flash + Impact
            await wait(100);
            rmFlash?.classList.add('rm-flash-fire');
            el.classList.add('rm-shake-impact');
            document.body.classList.add('rm-world-flash');

            wait(500).then(() => {
                el.classList.remove('rm-shake-impact');
                rmFlash?.classList.remove('rm-flash-fire');
            });

            wait(800).then(() => {
                document.body.classList.remove('rm-world-flash');
            });

            // Phase 4 — Complete
            await wait(COMPLETE_AT - FLASH_AT);
            el.classList.add('rm-complete');
        }
    }

    // ═══════════════════════════════════════════════
    //  8. KEYBOARD NAVIGATION
    // ═══════════════════════════════════════════════
    const navLinks = $$('.chapter-nav a:not(.disabled)');

    if (navLinks.length) {
        const prevLink = navLinks.find(a => a.textContent.includes('←'));
        const nextLink = navLinks.find(a => a.textContent.includes('→'));
        const tocLink  = navLinks.find(a => a.textContent.includes('Table'));

        document.addEventListener('keydown', e => {
            if (e.target.closest('input, textarea, select, [contenteditable]')) return;

            switch (e.key) {
                case 'ArrowLeft':  prevLink?.click(); break;
                case 'ArrowRight': nextLink?.click(); break;
                case 'Escape':     tocLink?.click();  break;
            }
        });
    }

})();
