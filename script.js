/* ===================================================
   FATE/STAY LAST TIME — INTERACTIVE ENGINE
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. SUMMONING CIRCLE LOADER =====
    const loader = document.querySelector('.summoning-loader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 800);
        });
    }

    // ===== 2. COMMAND SEAL SCROLL PROGRESS =====
    const progressBar = document.querySelector('.command-seal-progress');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            progressBar.style.height = scrollPercent + '%';
        });
    }

    // ===== 3. PRANA PARTICLES =====
    const canvas = document.getElementById('prana-particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const PARTICLE_COUNT = 35;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

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

                // Randomly choose gold, blue, or cyan
                const colors = [
                    { r: 201, g: 168, b: 76 },   // gold
                    { r: 58, g: 123, b: 213 },    // saber blue
                    { r: 64, g: 224, b: 208 },    // prana cyan
                ];
                this.color = colors[Math.floor(Math.random() * colors.length)];
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

                // Glow
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

    // ===== 4. SOUND EFFECT SHAKE ON SCROLL =====
    const shakeElements = document.querySelectorAll('.sound-effect');
    if (shakeElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('shake');
                    // Remove after animation ends so it can retrigger
                    setTimeout(() => {
                        entry.target.classList.remove('shake');
                    }, 500);
                }
            });
        }, { threshold: 0.8 });

        shakeElements.forEach(el => observer.observe(el));
    }

    // ===== 5. HOUR TRACKER DOTS =====
    const hourHeadings = document.querySelectorAll('.hour-heading');
    const hourDots = document.querySelectorAll('.hour-dot');

    if (hourHeadings.length > 0 && hourDots.length > 0) {
        const hourObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const index = Array.from(hourHeadings).indexOf(entry.target);
                if (index >= 0 && index < hourDots.length) {
                    if (entry.isIntersecting) {
                        // Mark all previous as active, current as current
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

    // ===== 6. INCANTATION TYPING EFFECT =====
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
                // Handle HTML tags
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
