/* ===================================================
   FATE/STAY LAST TIME — INTERACTIVE ENGINE v2.3
   Modern ES2024 · RAF Delta · Async Sequences
   Single Observer Pool · Passive Scroll
   All Sections Inside IIFE
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

                ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.15})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, 6.2832);
                ctx.fill();

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
    //  9. SCROLL-TRIGGERED COMPONENT REVEALS
    //     All chapters — Battle UI, Story UI, etc.
    // ═══════════════════════════════════════════════

    // ── Chapter 6 Components ──
    observeOnce($$('.battle-status'), el => {
        el.classList.add('bs-revealed');
    }, { threshold: 0.3 });

    observeOnce($$('.prana-gauge'), el => {
        el.classList.add('pg-revealed');
    }, { threshold: 0.5 });

    observeOnce($$('.shadow-emergence'), el => {
        el.classList.add('se-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.golden-dissolution'), el => {
        el.classList.add('gd-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.breaking-news'), el => {
        el.classList.add('bn-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.threat-grid'), el => {
        el.classList.add('tg-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.impact-line'), el => {
        el.classList.add('il-revealed');
    }, { threshold: 0.5 });

    observeOnce($$('.saber-break'), el => {
        el.classList.add('sb-revealed');
    }, { threshold: 0.4 });

    // ── Chapter 8 Components ──
    observeOnce($$('.circuit-awakening'), el => {
        el.classList.add('ca-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.faction-board'), el => {
        el.classList.add('fb-revealed');
    }, { threshold: 0.3 });

    observeOnce($$('.pact-declaration'), el => {
        el.classList.add('pact-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.contract-transfer'), el => {
        el.classList.add('ct-revealed');
    }, { threshold: 0.4 });

    // ── Chapter 9 — UI Components ──
    observeOnce($$('.tactical-comms'), el => {
        el.classList.add('comms-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.bounded-field-alert'), el => {
        el.classList.add('bf-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.illusion-zone'), el => {
        el.classList.add('iz-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.circuit-overload'), el => {
        el.classList.add('co-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.mortal-vitals'), el => {
        el.classList.add('mv-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.beast-reveal'), el => {
        el.classList.add('br-revealed');
    }, { threshold: 0.5 });

    // ── Chapter 9 — Story UI Components ──
    observeOnce($$('.memory-corridor'), el => {
        el.classList.add('mc-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.enforcer-dossier'), el => {
        el.classList.add('ed-revealed');
    }, { threshold: 0.3 });

    observeOnce($$('.projection-counter'), el => {
        el.classList.add('pc-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.shield-projection'), el => {
        el.classList.add('sp-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.negotiation-mode'), el => {
        el.classList.add('nm-revealed');
    }, { threshold: 0.3 });

    observeOnce($$('.revelation-block'), el => {
        el.classList.add('rv-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.dragon-core-burst'), el => {
        el.classList.add('dcb-revealed');
    }, { threshold: 0.4 });

    observeOnce($$('.wound-aftermath'), el => {
        el.classList.add('wa-revealed');
    }, { threshold: 0.4 });

    // ═══════════════════════════════════════════════
    //  10. READING PROGRESS SAVE
    // ═══════════════════════════════════════════════
    const ReadingProgress = (() => {
        const SAVE_KEY = 'fate-reading-progress';
        const SAVE_INTERVAL = 2000;

        const getChapterId = () => {
            const path = window.location.pathname;
            const match = path.match(/chapter-(\d+)/);
            return match ? `chapter-${match[1]}` : null;
        };

        const loadAll = () => {
            try {
                return JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
            } catch {
                return {};
            }
        };

        const save = (chapterId, data) => {
            const all = loadAll();
            all[chapterId] = { ...data, timestamp: Date.now() };
            localStorage.setItem(SAVE_KEY, JSON.stringify(all));
        };

        const get = chapterId => {
            const all = loadAll();
            return all[chapterId] || null;
        };

        const markComplete = chapterId => {
            save(chapterId, { complete: true, scrollPct: 100 });
        };

        const chapterId = getChapterId();

        if (chapterId) {
            let saveTimer = null;

            const saved = get(chapterId);
            if (saved && !saved.complete && saved.scrollY) {
                setTimeout(() => {
                    window.scrollTo({
                        top: saved.scrollY,
                        behavior: 'instant'
                    });
                    showResumeToast(saved.scrollPct);
                }, 300);
            }

            window.addEventListener('scroll', () => {
                if (saveTimer) return;

                saveTimer = setTimeout(() => {
                    const { scrollTop, scrollHeight, clientHeight } =
                        document.documentElement;
                    const pct = Math.round(
                        (scrollTop / (scrollHeight - clientHeight)) * 100
                    );

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
    // ═══════════════════════════════════════════════
    const ReadingTime = (() => {
        const prose = $('.prose');
        if (!prose) return;

        const text = prose.innerText || prose.textContent || '';
        const wordCount = text
            .trim()
            .split(/\s+/)
            .filter(w => w.length > 0).length;
        const minutes = Math.ceil(wordCount / 230);

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
    // ═══════════════════════════════════════════════
    const Dashboard = (() => {
        const chapterList = $('.chapter-list');
        const isHomepage = chapterList &&
            !window.location.pathname.includes('chapter');
        if (!isHomepage) return;

        const progress = ReadingProgress.loadAll();
        const totalChapters = 9;
        let completedCount = 0;

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

})();

// ============================================
// 🔥 QoL FEATURES — PROGRESS BAR, KEYBOARD NAV, SAVE POSITION
// ============================================

(function () {
    'use strict';

    // --- Detect if we're on a chapter page ---
    const isChapterPage = window.location.pathname.includes('/chapters/');

    // =====================
    // 📊 READING PROGRESS BAR (Chapter pages only)
    // =====================
    if (isChapterPage) {
        const progressBar = document.createElement('div');
        progressBar.classList.add('reading-progress-bar');
        document.body.prepend(progressBar);

        function updateProgress() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;

            if (docHeight <= 0) {
                progressBar.style.width = '100%';
                return;
            }

            const progress = Math.min((scrollTop / docHeight) * 100, 100);
            progressBar.style.width = progress + '%';
        }

        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress, { passive: true });

        // Initial call
        updateProgress();
    }

    // =====================
    // ⌨️ KEYBOARD NAVIGATION (Chapter pages only)
    // =====================
    if (isChapterPage) {
        document.addEventListener('keydown', function (e) {
            // Don't trigger if user is typing in an input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Find navigation links
            // Adjust these selectors to match YOUR actual nav structure
            const allLinks = document.querySelectorAll('a[href*="chapter-"]');
            const navContainer = document.querySelector('.chapter-nav, .nav-buttons, .story-navigation');

            let prevLink = null;
            let nextLink = null;

            if (navContainer) {
                // If you have a dedicated nav container, use its links
                const navLinks = navContainer.querySelectorAll('a');
                navLinks.forEach(function (link) {
                    const text = link.textContent.toLowerCase();
                    const href = link.getAttribute('href');
                    if (!href || href === '#') return;

                    if (text.includes('prev') || text.includes('←') || text.includes('back')) {
                        prevLink = link;
                    }
                    if (text.includes('next') || text.includes('→') || text.includes('forward')) {
                        nextLink = link;
                    }
                });
            }

            // Fallback: auto-detect from current chapter number
            if (!prevLink || !nextLink) {
                const match = window.location.pathname.match(/chapter-(\d+)/);
                if (match) {
                    const currentChapter = parseInt(match[1]);

                    if (!prevLink && currentChapter > 1) {
                        const prevHref = window.location.pathname.replace(
                            'chapter-' + currentChapter,
                            'chapter-' + (currentChapter - 1)
                        );
                        prevLink = { href: prevHref };
                    }

                    if (!nextLink) {
                        const nextHref = window.location.pathname.replace(
                            'chapter-' + currentChapter,
                            'chapter-' + (currentChapter + 1)
                        );
                        nextLink = { href: nextHref };
                    }
                }
            }

            // Arrow Left = Previous Chapter
            if (e.key === 'ArrowLeft' && prevLink) {
                e.preventDefault();
                window.location.href = prevLink.href;
            }

            // Arrow Right = Next Chapter
            if (e.key === 'ArrowRight' && nextLink) {
                e.preventDefault();
                window.location.href = nextLink.href;
            }
        });
    }

    // =====================
    // 💾 SAVE & RESTORE READING POSITION (Chapter pages only)
    // =====================
    if (isChapterPage) {
        const chapterKey = 'readPos_' + window.location.pathname;
        const lastChapterKey = 'lastChapterVisited';

        // --- Save scroll position (debounced) ---
        let saveTimer = null;

        window.addEventListener('scroll', function () {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(function () {
                try {
                    localStorage.setItem(chapterKey, window.scrollY.toString());
                } catch (e) {
                    // localStorage full or unavailable — fail silently
                }
            }, 400);
        }, { passive: true });

        // --- Save last visited chapter ---
        try {
            localStorage.setItem(lastChapterKey, window.location.href);
        } catch (e) {
            // fail silently
        }

        // --- Restore position on load ---
        window.addEventListener('load', function () {
            try {
                const savedPos = localStorage.getItem(chapterKey);
                if (savedPos && parseInt(savedPos) > 100) {
                    // Small delay to let your VN components render first
                    setTimeout(function () {
                        window.scrollTo({
                            top: parseInt(savedPos),
                            behavior: 'smooth'
                        });
                    }, 500);
                }
            } catch (e) {
                // fail silently
            }
        });
    }

    // =====================
    // 🏠 "CONTINUE READING" — Homepage helper (Optional)
    // =====================
    // This runs on the homepage and can be used to show a "Continue Reading" button
    if (!isChapterPage) {
        try {
            const lastChapter = localStorage.getItem('lastChapterVisited');
            if (lastChapter) {
                // You can use this to dynamically show a "Continue Reading" button
                // Example: create a floating button
                const continueBtn = document.createElement('a');
                continueBtn.href = lastChapter;
                continueBtn.textContent = '📖 Continue Reading';
                continueBtn.style.cssText = [
                    'position: fixed',
                    'bottom: 25px',
                    'right: 25px',
                    'background: linear-gradient(135deg, #e94560, #c0392b)',
                    'color: white',
                    'padding: 12px 24px',
                    'border-radius: 30px',
                    'text-decoration: none',
                    'font-size: 0.95rem',
                    'font-weight: bold',
                    'z-index: 9999',
                    'box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4)',
                    'transition: transform 0.2s, box-shadow 0.2s',
                    'font-family: inherit'
                ].join(';');

                continueBtn.addEventListener('mouseenter', function () {
                    this.style.transform = 'translateY(-3px)';
                    this.style.boxShadow = '0 6px 20px rgba(233, 69, 96, 0.6)';
                });

                continueBtn.addEventListener('mouseleave', function () {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 15px rgba(233, 69, 96, 0.4)';
                });

                document.body.appendChild(continueBtn);
            }
        } catch (e) {
            // fail silently
        }
    }

})();
