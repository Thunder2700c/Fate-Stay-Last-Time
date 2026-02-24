/* ===================================================
   FATE/STAY LAST TIME — INTERACTIVE ENGINE
   Theme + Particles + Scroll + Shake + Typing
   + Three-Phase Reality Marble
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. THEME SYSTEM =====
    const themeToggle = document.querySelector('.theme-toggle');
    const STORAGE_KEY = 'fate-theme';

    function getStoredTheme() {
        return localStorage.getItem(STORAGE_KEY) || 'void';
    }

    function setTheme(theme) {
        document.body.className = '';
        document.body.classList.add('theme-' + theme);
        localStorage.setItem(STORAGE_KEY, theme);
        updateToggleButton(theme);
        updateParticleColors(theme);
    }

    function updateToggleButton(theme) {
        if (!themeToggle) return;
        if (theme === 'void') {
            themeToggle.setAttribute('data-tooltip', 'Switch to Avalon');
        } else {
            themeToggle.setAttribute('data-tooltip', 'Switch to Void');
        }
    }

    setTheme(getStoredTheme());

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = getStoredTheme();
            const next = current === 'void' ? 'avalon' : 'void';
            setTheme(next);
        });
    }

    // ===== 2. LOADING SCREEN =====
    const loader = document.querySelector('.summoning-loader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 1200);
        });
    }

    // ===== 3. COMMAND SEAL SCROLL PROGRESS =====
    const progressBar = document.querySelector('.command-seal-progress');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            progressBar.style.height = scrollPercent + '%';
        });
    }

    // ===== 4. PRANA PARTICLES =====
    const canvas = document.getElementById('prana-particles');
    let particles = [];
    let particleColors = [];
    const PARTICLE_COUNT = 35;

    function getThemeParticleColors() {
        const style = getComputedStyle(document.body);
        return [
            {
                r: parseInt(style.getPropertyValue('--particle-1-r')),
                g: parseInt(style.getPropertyValue('--particle-1-g')),
                b: parseInt(style.getPropertyValue('--particle-1-b'))
            },
            {
                r: parseInt(style.getPropertyValue('--particle-2-r')),
                g: parseInt(style.getPropertyValue('--particle-2-g')),
                b: parseInt(style.getPropertyValue('--particle-2-b'))
            },
            {
                r: parseInt(style.getPropertyValue('--particle-3-r')),
                g: parseInt(style.getPropertyValue('--particle-3-g')),
                b: parseInt(style.getPropertyValue('--particle-3-b'))
            }
        ];
    }

    function updateParticleColors(theme) {
        setTimeout(() => {
            particleColors = getThemeParticleColors();
            particles.forEach(p => {
                p.color = particleColors[Math.floor(Math.random() * particleColors.length)];
            });
        }, 100);
    }

    if (canvas) {
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        particleColors = getThemeParticleColors();

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2.5 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = -Math.random() * 0.4 - 0.1;
                this.opacity = Math.random() * 0.4 + 0.1;
                this.fadeSpeed = Math.random() * 0.003 + 0.001;
                this.growing = true;
                this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.growing) {
                    this.opacity += this.fadeSpeed;
                    if (this.opacity >= 0.5) this.growing = false;
                } else {
                    this.opacity -= this.fadeSpeed;
                    if (this.opacity <= 0) this.reset();
                }

                if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
                    this.reset();
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 0.15})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animateParticles);
        }

        animateParticles();
    }

    // ===== 5. SOUND EFFECT SHAKE ON SCROLL =====
    const shakeElements = document.querySelectorAll('.sound-effect');
    if (shakeElements.length > 0) {
        const shakeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('shake');
                    setTimeout(() => {
                        entry.target.classList.remove('shake');
                    }, 500);
                }
            });
        }, { threshold: 0.8 });

        shakeElements.forEach(el => shakeObserver.observe(el));
    }

        // ===== 6. REALITY MARBLE — FORGE REVEAL =====
    const rmDeclare = document.querySelector('.reality-marble-declare');

    if (rmDeclare) {
        const rmTitle = rmDeclare.querySelector('.rm-title');
        const rmFlash = rmDeclare.querySelector('.rm-flash-overlay');
        const rmText = rmTitle ? rmTitle.getAttribute('data-rm-text') : null;

        // Split text into individual character spans
        if (rmTitle && rmText) {
            rmTitle.innerHTML = '';
            let charIndex = 0;

            for (let i = 0; i < rmText.length; i++) {
                if (rmText[i] === ' ') {
                    const space = document.createElement('span');
                    space.className = 'rm-space';
                    rmTitle.appendChild(space);
                } else {
                    const span = document.createElement('span');
                    span.className = 'rm-char';
                    span.textContent = rmText[i];
                    span.style.setProperty('--i', charIndex);
                    rmTitle.appendChild(span);
                    charIndex++;
                }
            }
        }

        // Check reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Observe and trigger
        const rmObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !rmDeclare.dataset.triggered) {
                    rmDeclare.dataset.triggered = 'true';

                    if (prefersReducedMotion) {
                        // Instant reveal — no animation
                        rmDeclare.classList.add('rm-active', 'rm-complete');
                        const allChars = rmDeclare.querySelectorAll('.rm-char');
                        allChars.forEach(c => {
                            c.style.opacity = '1';
                            c.style.transform = 'none';
                        });
                    } else {
                        triggerForgeSequence();
                    }
                }
            });
        }, { threshold: 0.4 });

        rmObserver.observe(rmDeclare);

        function triggerForgeSequence() {
            const chars = rmDeclare.querySelectorAll('.rm-char');
            const totalChars = chars.length;

            // Timing constants
            const BUILDUP = 400;
            const CHAR_STAGGER = 70;   // per char (handled by CSS --i)
            const CHAR_DURATION = 500;  // each char animation length
            const FORGE_END = BUILDUP + ((totalChars - 1) * CHAR_STAGGER) + CHAR_DURATION;
            const FLASH_TIME = FORGE_END + 200;
            const COMPLETE_TIME = FLASH_TIME + 600;

            // Phase 0: Activate atmosphere — gears engage, corners appear
            rmDeclare.classList.add('rm-active');

            // Phase 1: Micro-tremor builds during forge
            setTimeout(() => {
                rmDeclare.classList.add('rm-shake-tremor');
            }, 100);

            // Phase 2: Forge all letters (CSS staggers via --i × 70ms)
            setTimeout(() => {
                chars.forEach(char => char.classList.add('rm-forged'));
            }, BUILDUP);

            // Remove tremor before impact
            setTimeout(() => {
                rmDeclare.classList.remove('rm-shake-tremor');
            }, FLASH_TIME - 100);

            // Phase 3: Flash + Impact
            setTimeout(() => {
                // Container flash
                if (rmFlash) rmFlash.classList.add('rm-flash-fire');

                // Impact shake
                rmDeclare.classList.add('rm-shake-impact');

                // Page-wide reality flash
                document.body.classList.add('rm-world-flash');

                // Clean up
                setTimeout(() => {
                    rmDeclare.classList.remove('rm-shake-impact');
                    if (rmFlash) rmFlash.classList.remove('rm-flash-fire');
                }, 500);

                setTimeout(() => {
                    document.body.classList.remove('rm-world-flash');
                }, 800);
            }, FLASH_TIME);

            // Phase 4: Complete — persistent breathing + subtitle
            setTimeout(() => {
                rmDeclare.classList.add('rm-complete');
            }, COMPLETE_TIME);
        }
    }

    // ===== 7. HOUR TRACKER DOTS =====
    const hourHeadings = document.querySelectorAll('.hour-heading');
    const hourDots = document.querySelectorAll('.hour-dot');

    if (hourHeadings.length > 0 && hourDots.length > 0) {
        const hourObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const index = Array.from(hourHeadings).indexOf(entry.target);
                if (index >= 0 && index < hourDots.length) {
                    if (entry.isIntersecting) {
                        hourDots.forEach((dot, i) => {
                            dot.classList.remove('current');
                            if (i < index) {
                                dot.classList.add('active');
                            } else if (i === index) {
                                dot.classList.add('active');
                                dot.classList.add('current');
                            }
                        });
                    }
                }
            });
        }, { threshold: 0.3 });

        hourHeadings.forEach(h => hourObserver.observe(h));
    }

    // ===== 8. INCANTATION TYPING EFFECT =====
    const incantations = document.querySelectorAll('.incantation[data-typed]');
    if (incantations.length > 0) {
        const typedObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.typed_done) {
                    entry.target.dataset.typed_done = 'true';
                    typeIncantation(entry.target);
                }
            });
        }, { threshold: 0.5 });

        incantations.forEach(el => typedObserver.observe(el));
    }

    function typeIncantation(element) {
        const html = element.innerHTML;
        element.innerHTML = '';
        element.style.visibility = 'visible';

        let i = 0;
        let output = '';
        const speed = 30;

        function typeChar() {
            if (i < html.length) {
                if (html[i] === '<') {
                    const closeIndex = html.indexOf('>', i);
                    output += html.substring(i, closeIndex + 1);
                    i = closeIndex + 1;
                } else {
                    output += html[i];
                    i++;
                }
                element.innerHTML = output;
                setTimeout(typeChar, speed);
            }
        }

        typeChar();
    }

});
