/* ===================================================
   FATE/STAY LAST TIME — INTERACTIVE ENGINE v2.2
   Modern ES2024 · RAF Delta · Async Sequences
   Single Observer Pool · Passive Scroll
   FIXED: Section 9 moved inside IIFE
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
            const { scrollTop, scrollHeight, clientHeight } =
                document.documentElement;
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

        const resizeCanvas = () => {
            const newW = window.innerWidth;
            const newH = window.innerHeight;
            if (newW === W && newH === H) return;
            W = canvas.width  = newW;
            H = canvas.height = newH;
        };

        resizeCanvas();

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

        // ── Render Loop ──
        let lastTime = performance.now();

        const tick = now => {
            const dt = clamp((now - lastTime) / 16.667, 0.1, 3);
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

        async function forgeSequence(el) {
            const chars      = el.querySelectorAll('.rm-char');
            const total      = chars.length;
            const STAGGER    = 70;
            const CHAR_DUR   = 500;
            const BUILDUP    = 400;
            const FORGE_END  = BUILDUP + ((total - 1) * STAGGER) + CHAR_DUR;
            const FLASH_AT   = FORGE_END + 200;
            const COMPLETE_AT = FLASH_AT + 600;

            el.classList.add('rm-active');

            await wait(100);
            el.classList.add('rm-shake-tremor');

            await wait(BUILDUP - 100);
            chars.forEach(c => c.classList.add('rm-forged'));

            await wait(FLASH_AT - BUILDUP - 100);
            el.classList.remove('rm-shake-tremor');

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
            if (e.target.closest('input, textarea, select, [contenteditable]'))
                return;

            switch (e.key) {
                case 'ArrowLeft':  prevLink?.click(); break;
                case 'ArrowRight': nextLink?.click(); break;
                case 'Escape':     tocLink?.click();  break;
            }
        });
    }

    // ═══════════════════════════════════════════════
    //  9. CHAPTER 6+ BATTLE COMPONENTS
    //     (NOW INSIDE THE IIFE — FIXED)
    // ═══════════════════════════════════════════════

    // ── Battle Status: animate HP bars on scroll ──
    observeOnce($$('.battle-status'), el => {
        el.classList.add('bs-revealed');
    }, { threshold: 0.3 });

    // ── Prana Gauge: animate depletion ──
    observeOnce($$('.prana-gauge'), el => {
        el.classList.add('pg-revealed');
    }, { threshold: 0.5 });

    // ── Shadow Emergence: reveal ──
    observeOnce($$('.shadow-emergence'), el => {
        el.classList.add('se-revealed');
    }, { threshold: 0.4 });

    // ── Golden Dissolution: reveal ──
    observeOnce($$('.golden-dissolution'), el => {
        el.classList.add('gd-revealed');
    }, { threshold: 0.4 });

    // ── Breaking News: reveal ──
    observeOnce($$('.breaking-news'), el => {
        el.classList.add('bn-revealed');
    }, { threshold: 0.4 });

    // ── Threat Grid: reveal ──
    observeOnce($$('.threat-grid'), el => {
        el.classList.add('tg-revealed');
    }, { threshold: 0.4 });

    // ── Impact Line: reveal ──
    observeOnce($$('.impact-line'), el => {
        el.classList.add('il-revealed');
    }, { threshold: 0.5 });

    // ── Saber Break Declaration: reveal ──
    observeOnce($$('.saber-break'), el => {
        el.classList.add('sb-revealed');
    }, { threshold: 0.4 });

       // ── Circuit Awakening: reveal ──
    observeOnce($$('.circuit-awakening'), el => {
        el.classList.add('ca-revealed');
    }, { threshold: 0.4 });

    // ── Faction Board: reveal ──
    observeOnce($$('.faction-board'), el => {
        el.classList.add('fb-revealed');
    }, { threshold: 0.3 });

    // ── Pact Declaration: reveal ──
    observeOnce($$('.pact-declaration'), el => {
        el.classList.add('pact-revealed');
    }, { threshold: 0.4 });

    // ── Contract Transfer: reveal ──
    observeOnce($$('.contract-transfer'), el => {
        el.classList.add('ct-revealed');
    }, { threshold: 0.4 });

    // ═══════════════════════════════════════════════
    //  10. READING PROGRESS SAVE
    //      Saves scroll position per chapter
    // ═══════════════════════════════════════════════
    const ReadingProgress = (() => {
        const SAVE_KEY = 'fate-reading-progress';
        const SAVE_INTERVAL = 2000; // Save every 2 seconds while scrolling

        // Get current chapter from URL
        const getChapterId = () => {
            const path = window.location.pathname;
            const match = path.match(/chapter-(\d+)/);
            return match ? `chapter-${match[1]}` : null;
        };

        // Load all progress data
        const loadAll = () => {
            try {
                return JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
            } catch {
                return {};
            }
        };

        // Save progress for current chapter
        const save = (chapterId, data) => {
            const all = loadAll();
            all[chapterId] = { ...data, timestamp: Date.now() };
            localStorage.setItem(SAVE_KEY, JSON.stringify(all));
        };

        // Get progress for a specific chapter
        const get = chapterId => {
            const all = loadAll();
            return all[chapterId] || null;
        };

        // Mark chapter as completed
        const markComplete = chapterId => {
            save(chapterId, { complete: true, scrollPct: 100 });
        };

        const chapterId = getChapterId();

        if (chapterId) {
            let saveTimer = null;
            let lastPct = 0;

            // Restore scroll position on load
            const saved = get(chapterId);
            if (saved && !saved.complete && saved.scrollY) {
                // Small delay to let page render
                setTimeout(() => {
                    window.scrollTo({
                        top: saved.scrollY,
                        behavior: 'instant'
                    });

                    // Show resume notification
                    showResumeToast(saved.scrollPct);
                }, 300);
            }

            // Save on scroll
            window.addEventListener('scroll', () => {
                if (saveTimer) return;

                saveTimer = setTimeout(() => {
                    const { scrollTop, scrollHeight, clientHeight } =
                        document.documentElement;
                    const pct = Math.round(
                        (scrollTop / (scrollHeight - clientHeight)) * 100
                    );

                    lastPct = pct;

                    if (pct >= 95) {
                        markComplete(chapterId);
                    } else {
                        save(chapterId, {
                            scrollY: scrollTop,
                            scrollPct: pct,
                            complete: false
                        });
                    }

                    saveTimer = null;
                }, SAVE_INTERVAL);
            }, { passive: true });
        }

        // Resume toast notification
        function showResumeToast(pct) {
            const toast = document.createElement('div');
            toast.className = 'resume-toast';
            toast.innerHTML = `
                <span class="resume-icon">📖</span>
                <span class="resume-text">Resuming from ${pct}%</span>
                <button class="resume-restart" aria-label="Start from beginning">
                    ↺ Restart
                </button>
            `;
            document.body.appendChild(toast);

            // Restart button
            toast.querySelector('.resume-restart')
                .addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (chapterId) {
                        save(chapterId, {
                            scrollY: 0,
                            scrollPct: 0,
                            complete: false
                        });
                    }
                    toast.classList.add('toast-hide');
                    setTimeout(() => toast.remove(), 500);
                });

            // Auto-hide after 4 seconds
            requestAnimationFrame(() => toast.classList.add('toast-show'));
            setTimeout(() => {
                toast.classList.add('toast-hide');
                setTimeout(() => toast.remove(), 500);
            }, 4000);
        }

        return { loadAll, get, getChapterId, markComplete };
    })();

    // ═══════════════════════════════════════════════
    //  11. ESTIMATED READING TIME
    //      Calculates and displays reading time
    // ═══════════════════════════════════════════════
    const ReadingTime = (() => {
        const prose = $('.prose');
        if (!prose) return;

        const text = prose.innerText || prose.textContent || '';
        const wordCount = text
            .trim()
            .split(/\s+/)
            .filter(w => w.length > 0).length;
        const minutes = Math.ceil(wordCount / 230); // Average reading speed

        // Create reading time element
        const chapterHeader = $('.chapter-header');
        if (chapterHeader) {
            const timeEl = document.createElement('div');
            timeEl.className = 'reading-time';
            timeEl.innerHTML = `
                <span class="rt-icon">⏱</span>
                <span class="rt-text">${minutes} min read</span>
                <span class="rt-separator">·</span>
                <span class="rt-words">${wordCount.toLocaleString()} words</span>
            `;
            chapterHeader.appendChild(timeEl);
        }
    })();

    // ═══════════════════════════════════════════════
    //  12. READING STATS DASHBOARD (Homepage)
    //      Shows read/unread chapters + progress
    // ═══════════════════════════════════════════════
    const Dashboard = (() => {
        // Only run on homepage
        const chapterList = $('.chapter-list');
        const isHomepage = chapterList &&
            !window.location.pathname.includes('chapter');
        if (!isHomepage) return;

        const progress = ReadingProgress.loadAll();
        const totalChapters = 6; // Update when adding chapters
        let completedCount = 0;

        // Add status indicators to chapter links
        $$('.chapter-list a:not(.locked)').forEach(link => {
            const href = link.getAttribute('href') || '';
            const match = href.match(/chapter-(\d+)/);
            if (!match) return;

            const chapterId = `chapter-${match[1]}`;
            const data = progress[chapterId];

            if (data?.complete) {
                completedCount++;
                const badge = document.createElement('span');
                badge.className = 'read-badge';
                badge.textContent = '✓ Read';
                link.appendChild(badge);
                link.classList.add('chapter-read');
            } else if (data?.scrollPct > 0) {
                const badge = document.createElement('span');
                badge.className = 'read-badge reading';
                badge.textContent = `${data.scrollPct}%`;
                link.appendChild(badge);
                link.classList.add('chapter-in-progress');
            }
        });

        // Add overall stats bar above chapter list
        if (completedCount > 0 || Object.keys(progress).length > 0) {
            const statsEl = document.createElement('div');
            statsEl.className = 'reading-dashboard';

            const readPct = Math.round(
                (completedCount / totalChapters) * 100
            );

            statsEl.innerHTML = `
                <div class="rd-header">
                    <span class="rd-title">Your Progress</span>
                    <span class="rd-stats">
                        ${completedCount}/${totalChapters} Chapters
                    </span>
                </div>
                <div class="rd-bar">
                    <div class="rd-fill" style="width: ${readPct}%"></div>
                </div>
                <div class="rd-label">
                    ${readPct}% Complete
                </div>
            `;

            chapterList.insertBefore(
                statsEl,
                chapterList.querySelector('h2')?.nextSibling
            );
        }
    })();

    // ═══════════════════════════════════════════════
    //  13. BACK TO TOP BUTTON
    //      Appears on scroll, themed
    // ═══════════════════════════════════════════════
    const BackToTop = (() => {
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Back to top');
        btn.innerHTML = '↑';
        document.body.appendChild(btn);

        let visible = false;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;

            requestAnimationFrame(() => {
                const shouldShow = window.scrollY > 600;

                if (shouldShow !== visible) {
                    visible = shouldShow;
                    btn.classList.toggle('btt-visible', visible);
                }
                ticking = false;
            });
        }, { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    })();
})(); // <-- IIFE closes AFTER Section 9 now ✅
