
/* ===================================================
   FATE/STAY LAST TIME — INTERACTIVE ENGINE v2
   Modern ES2024 · RAF Delta · Async Sequences
   Single Observer Pool · Passive Scroll · ResizeObserver
   =================================================== */

;(() => {
    'use strict';

    // ─── Constants ───
    const STORAGE_KEY   = 'fate-theme';
    const PARTICLE_COUNT = 35;
    const LOADER_DELAY   = 1200;
    const TYPE_SPEED     = 30;

    // ─── Utilities ───
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const rand  = (lo = 0, hi = 1) => Math.random() * (hi - lo) + lo;
    const pick  = arr => arr[Math.floor(Math.random() * arr.length)];

    const prefersReducedMotion = 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        };

        apply(current);

        toggle?.addEventListener('click', () =>
            apply(current === 'void' ? 'avalon' : 'void')
        );

        return { get current() { return current; }, apply };
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
        let W, H;

        // ── Resize via ResizeObserver ──
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            W = canvas.width  = width;
            H = canvas.height = height;
        });
        ro.observe(document.documentElement);
        W = canvas.width  = innerWidth;
        H = canvas.height = innerHeight;

        // ── Theme-aware colors ──
        const readColors = () => {
            const s = getComputedStyle(document.body);
            const c = (prefix) => ({
                r: parseInt(s.getPropertyValue(`--particle-${prefix}-r`)),
                g: parseInt(s.getPropertyValue(`--particle-${prefix}-g`)),
                b: parseInt(s.getPropertyValue(`--particle-${prefix}-b`)),
            });
            return [c('1'), c('2'), c('3')];
        };

        let palette = readColors();

        // Re-read palette when theme changes
        const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        const originalApply = Theme.apply;
        Theme.apply = (t) => {
            originalApply(t);
            requestAnimationFrame(() => {
                palette = readColors();
                pool.forEach(p => p.color = pick(palette));
            });
        };
        // Trigger initial re-read after DOM settles
        requestAnimationFrame(() => palette = readColors());

        // ── Object Pool ──
        const createParticle = () => ({
            x: rand(0, W),
            y: rand(0, H),
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
        let lastTime = 0;

        const tick = (now) => {
            const dt = Math.min((now - lastTime) / 16.667, 3); // cap at 3× speed
            lastTime = now;

            ctx.clearRect(0, 0, W, H);

            for (const p of pool) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;

                if (p.growing) {
                    p.opacity += p.fadeSpeed * dt;
                    if (p.opacity >= 0.5) p.growing = false;
                } else {
                    p.opacity -= p.fadeSpeed * dt;
                    if (p.opacity <= 0) { resetParticle(p); continue; }
                }

                if (p.y < -10 || p.x < -10 || p.x > W + 10) {
                    resetParticle(p);
                    continue;
                }

                const { r, g, b } = p.color;
                const a = clamp(p.opacity, 0, 1);

                // Glow halo
                ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.15})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }

    // ═══════════════════════════════════════════════
    //  5. UNIFIED INTERSECTION OBSERVER POOL
    //     Single observer handles all scroll-triggered effects
    // ═══════════════════════════════════════════════
    const observeOnce = (elements, callback, options = {}) => {
        if (!elements.length) return;

        const observer = new IntersectionObserver((entries, obs) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    obs.unobserve(entry.target); // fire once, then release
                }
            }
        }, { threshold: 0.5, ...options });

        elements.forEach(el => observer.observe(el));
        return observer;
    };

    const observeLive = (elements, callback, options = {}) => {
        if (!elements.length) return;

        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                callback(entry.target, entry.isIntersecting);
            }
        }, { threshold: 0.3, ...options });

        elements.forEach(el => observer.observe(el));
        return observer;
    };

    // ── Sound Effect Shake (fire-once) ──
    observeOnce($$('.sound-effect'), async el => {
        el.classList.add('shake');
        await wait(500);
        el.classList.remove('shake');
    }, { threshold: 0.8 });

    // ── Incantation Typing (fire-once) ──
    observeOnce($$('.incantation[data-typed]'), el => {
        typewriter(el);
    }, { threshold: 0.5 });

    // ── Hour Tracker Dots (live — tracks current section) ──
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

            // Skip full HTML tags in one frame
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
    //  7. REALITY MARBLE — FORGE REVEAL SEQUENCE
    // ═══════════════════════════════════════════════
    const rmDeclare = $('.reality-marble-declare');

    if (rmDeclare) {
        const rmTitle = rmDeclare.querySelector('.rm-title');
        const rmFlash = rmDeclare.querySelector('.rm-flash-overlay');
        const rmText  = rmTitle?.getAttribute('data-rm-text');

        // ── Split text into individual character spans ──
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

        // ── Trigger on scroll ──
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

        // ── Async Forge Choreography ──
        async function forgeSequence(el) {
            const chars      = el.querySelectorAll('.rm-char');
            const totalChars = chars.length;

            // Timing
            const STAGGER       = 70;
            const CHAR_ANIM     = 500;
            const BUILDUP       = 400;
            const FORGE_TOTAL   = BUILDUP + ((totalChars - 1) * STAGGER) + CHAR_ANIM;
            const FLASH_AT      = FORGE_TOTAL + 200;
            const COMPLETE_AT   = FLASH_AT + 600;

            // Phase 0 — Atmosphere: gears engage, corners appear
            el.classList.add('rm-active');

            // Phase 1 — Micro-tremor
            await wait(100);
            el.classList.add('rm-shake-tremor');

            // Phase 2 — Forge letters (CSS handles stagger via --i)
            await wait(BUILDUP - 100);
            chars.forEach(c => c.classList.add('rm-forged'));

            // Phase 2.5 — End tremor before impact
            await wait(FLASH_AT - BUILDUP - 100);
            el.classList.remove('rm-shake-tremor');

            // Phase 3 — Flash + Impact + World pulse
            await wait(100);
            rmFlash?.classList.add('rm-flash-fire');
            el.classList.add('rm-shake-impact');
            document.body.classList.add('rm-world-flash');

            // Clean up impact
            wait(500).then(() => {
                el.classList.remove('rm-shake-impact');
                rmFlash?.classList.remove('rm-flash-fire');
            });

            wait(800).then(() => {
                document.body.classList.remove('rm-world-flash');
            });

            // Phase 4 — Complete: breathing + subtitle
            await wait(COMPLETE_AT - FLASH_AT);
            el.classList.add('rm-complete');
        }
    }

    // ═══════════════════════════════════════════════
    //  8. KEYBOARD NAVIGATION (← → Esc)
    // ═══════════════════════════════════════════════
    const navLinks = $$('.chapter-nav a:not(.disabled)');

    if (navLinks.length) {
        const prevLink = navLinks.find(a => a.textContent.includes('←'));
        const nextLink = navLinks.find(a => a.textContent.includes('→'));
        const tocLink  = navLinks.find(a => a.textContent.includes('Table'));

        document.addEventListener('keydown', e => {
            // Don't hijack if user is typing in an input
            if (e.target.closest('input, textarea, select, [contenteditable]')) return;

            switch (e.key) {
                case 'ArrowLeft':
                    prevLink?.click();
                    break;
                case 'ArrowRight':
                    nextLink?.click();
                    break;
                case 'Escape':
                    tocLink?.click();
                    break;
            }
        });
    }

})();
