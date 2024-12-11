// GSAP and ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Enhanced GSAP Intro Animation
gsap.timeline()
    .fromTo(".title", 
        { y: -100, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 1.5, ease: "power3.out" }
    )
    .fromTo(".subtitle", 
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.5, ease: "power2.out" },
        "-=1" // Overlap animations
    );

// Animate Each Section on Scroll
document.querySelectorAll(".section").forEach((section, index) => {
    gsap.fromTo(
        section,
        { opacity: 0, y: 50 },
        {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: section,
                start: "top 80%", // Start animation when 80% of section is in view
                toggleActions: "play none none none", // Play animation once
            },
        }
    );
});

// Scroll Progress Bar
ScrollTrigger.create({
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
        document.getElementById("scroll-progress").style.width = `${self.progress * 100}%`;
    },
});
