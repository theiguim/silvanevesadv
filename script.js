const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');

    window.addEventListener('scroll', () => {
        navMenu.classList.remove('active');
    });
});

   gsap.registerPlugin(ScrollTrigger);

  gsap.fromTo(".statue img",
    { scale: 1 },  
    {
      scale: 2,      
      scrollTrigger: {
        trigger: ".statue",
        start: "top center",
        end: "bottom top",
        scrub: true,
      },
      ease: "none"
    }
  );