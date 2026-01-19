// Reveal animations – responsive, performant, error-free
(function () {
  if (!document.body.classList.contains("reveal-enabled")) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealElements = document.querySelectorAll(".reveal");
  const sectionHeaders = document.querySelectorAll(".section h3");

  // If reduced motion is enabled
  if (prefersReducedMotion) {
    revealElements.forEach(el => el.classList.add("reveal-visible"));
    sectionHeaders.forEach(el => el.classList.add("visible"));
    return;
  }

  // Observer options (mobile + desktop friendly)
  const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -40px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const target = entry.target;
      target.classList.add("reveal-visible");

      // Stagger child animations safely
      const children = target.children;
      for (let i = 0; i < children.length; i++) {
        children[i].style.transitionDelay = `${i * 0.08}s`;
      }

      observer.unobserve(target);
    });
  }, revealOptions);

  revealElements.forEach(el => observer.observe(el));

  // Section headers animation
  if (sectionHeaders.length) {
    const headerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          headerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    sectionHeaders.forEach(h => headerObserver.observe(h));
  }

})();

/* =========================
   REVEAL + AOS-LIKE ANIMATIONS
========================= */

(function () {
  // Reveal elements
  const reveals = document.querySelectorAll(".reveal, [data-animate]");
  const headers = document.querySelectorAll(".section h3");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    reveals.forEach(el => el.classList.add("animate-visible"));
    headers.forEach(el => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("animate-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  reveals.forEach(el => observer.observe(el));

  // Section headers
  const headerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        headerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  headers.forEach(h => headerObserver.observe(h));
})();
