// Registrar Plugins de GSAP
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

    // ---------------------------------------------------------------------------------
    // 1. MOTOR DE SCROLL SUAVE (LENIS)
    // ---------------------------------------------------------------------------------
    const lenis = new Lenis({
        duration: 1.2,
        lerp: 0.1,
        smoothWheel: true
    });

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    lenis.on('scroll', ScrollTrigger.update);

    // ---------------------------------------------------------------------------------
    // 2. NAVEGACIÓN Y MENÚ
    // ---------------------------------------------------------------------------------
    const boton = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.primary-nav');
    const icono = boton ? boton.querySelector('i') : null;

    if (boton && menu) {
        boton.onclick = () => {
            menu.classList.toggle('active');
            if (icono) icono.classList.toggle('fa-bars');
            if (icono) icono.classList.toggle('fa-times');
        };
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                lenis.scrollTo(target, { offset: -70 });
                if (menu) menu.classList.remove('active');
                if (icono) {
                    icono.classList.add('fa-bars');
                    icono.classList.remove('fa-times');
                }
            }
        });
    });

    // ---------------------------------------------------------------------------------
    // 3. COREOGRAFÍA DE ANIMACIONES (GSAP)
    // ---------------------------------------------------------------------------------

    // --- HERO ---
    const introTl = gsap.timeline();
    introTl
        .to(".hero-eyebrow", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.3 })
        .to(".hero-title", { y: 0, opacity: 1, duration: 1.1, ease: "power4.out" }, "-=0.5")
        .to(".hero-slogan", { y: 0, opacity: 1, duration: 1, ease: "power3.out" }, "-=0.7");

    gsap.to(".hero-parallax-bg", {
        yPercent: 15, ease: "none",
        scrollTrigger: { trigger: ".hero-container", start: "top top", end: "bottom top", scrub: true }
    });

    // --- PRESENTACIÓN ---
    gsap.from("#presentacion .section-title, #presentacion .section-lead, #presentacion .main-story, #presentacion .location-highlight", {
        y: 40, opacity: 0, stagger: 0.15, duration: 1, ease: "power2.out",
        scrollTrigger: { trigger: "#presentacion", start: "top 80%" }
    });

    // --- MAPA ---
    gsap.from(".map-container", {
        scale: 0.94, opacity: 0, duration: 1.1, ease: "expo.out",
        scrollTrigger: { trigger: ".map-section", start: "top 80%" }
    });

    // --- PILARES / POR QUÉ ELEGIRNOS ---
    document.querySelectorAll(".icon-block-grid, .authority-grid").forEach(grid => {
        gsap.from(grid.querySelectorAll(".animated-card"), {
            y: 60, opacity: 0, duration: 1, stagger: 0.15, ease: "power3.out",
            scrollTrigger: { trigger: grid, start: "top 85%" }
        });
    });

    // ---------------------------------------------------------------------------------
    // 4. CATÁLOGO — SCROLL HORIZONTAL INTELIGENTE (solo desktop)
    // ---------------------------------------------------------------------------------
    ScrollTrigger.matchMedia({

        "(min-width: 993px)": function () {
            const section = document.querySelector(".horizontal-scroll-section");
            const content = document.querySelector(".horizontal-content");

            if (section && content) {
                const scrollAmount = content.scrollWidth - window.innerWidth;

                gsap.to(content, {
                    x: -scrollAmount,
                    ease: "none",
                    scrollTrigger: {
                        trigger: section,
                        pin: true,
                        scrub: 1,
                        start: "top top",
                        end: () => "+=" + scrollAmount,
                        invalidateOnRefresh: true
                    }
                });
            }
        },

        "(max-width: 992px)": function () {
            gsap.from(".horizontal-panel", {
                y: 50, opacity: 0, stagger: 0.2, duration: 1,
                scrollTrigger: { trigger: ".horizontal-content", start: "top 80%" }
            });
        }
    });

    // --- HORARIOS ---
    gsap.from(".horario-row", {
        x: -30, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: ".horarios-box", start: "top 85%" }
    });

    // --- GALERÍA ---
    gsap.from(".gallery-item", {
        scale: 0.85, opacity: 0, stagger: 0.08, duration: 0.7, ease: "back.out(1.4)",
        scrollTrigger: { trigger: ".gallery-grid", start: "top 85%" }
    });

    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });

    // --- CONTACTO / CIERRE ---
    gsap.to(".cta-parallax-bg", {
        yPercent: 25, ease: "none",
        scrollTrigger: { trigger: ".final-cta-section", start: "top bottom", end: "bottom top", scrub: true }
    });

    const tlCta = gsap.timeline({
        scrollTrigger: {
            trigger: ".final-cta-content",
            start: "top 85%",
            toggleActions: "play none none none"
        }
    });

    tlCta.from(".final-cta-content > *", {
        y: 40, autoAlpha: 0, duration: 1, stagger: 0.15, ease: "power3.out"
    });

    gsap.to(".whatsapp-btn-simple", {
        scale: 1.05, duration: 1, repeat: -1, yoyo: true, ease: "sine.inOut"
    });
});
