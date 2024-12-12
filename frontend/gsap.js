
// TOP OF THE SKÆRM SCROLL KNAP!!! 
document.getElementById("scrollDownBtn").addEventListener("click", () => {
    // Scroll smoothly to the next section
    document.getElementById("nextSection").scrollIntoView({ behavior: "smooth" });
  });

  gsap.registerPlugin(ScrollTrigger);

  gsap.fromTo(
    ".instruction-text", // Target the instruction text
    { opacity: 0, y: 50 }, // Initial state: invisible and slightly below
    {
      opacity: 1,
      y: 0, // Animate to visible and original position
      duration: 1.5, // Duration of animation in seconds
      ease: "power2.out", // Smooth easing
      scrollTrigger: {
        trigger: "#nextSection", // Element to trigger the animation
        start: "top 90%", // When the element is 80% visible
        toggleActions: "play none none none", // Animation behavior
      },
    }
  );
  document.getElementById("scrollDownBtn").addEventListener("click", () => {
    const nextSection = document.querySelector("#nextSection"); // Target the next section
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" }); // Smoothly scroll to the section
    }
  });

  // SCroool til energi section! 
  document.getElementById("scrollToEnergy").addEventListener("click", () => {
    const energySection = document.getElementById("energySection");
    if (energySection) {
      window.scrollTo({
        top: energySection.offsetTop - 120, // Adjust the -100 value to set the desired offset
        behavior: "smooth"
      });
    }
  });

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

// Combined Animations for Heading and Button
gsap.timeline()
  .from(".energy-heading", {
    y: -100, // Slide in from above
    opacity: 0, // Start invisible
    duration: 1.5, // Duration of animation
    ease: "power3.out", // Smooth easing
  })
  .from("#scrollToComparison", {
    scale: 0.8, // Start slightly smaller
    opacity: 0, // Start invisible
    duration: 1, // Duration of animation
    ease: "back.out(1.7)", // Bounce-like effect
  }, "-=0.5"); // Overlap with the end of the previous animation

// Ensure the button remains visible after animation
gsap.to("#scrollToComparison", {
  opacity: 1, // Set to fully visible
  duration: 0.1, // Quick adjustment
});



