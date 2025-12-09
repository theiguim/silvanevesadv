// -------------------------------
// MENU HAMBÚRGUER RESPONSIVO
// -------------------------------

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// Abre / fecha o menu
hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Fecha o menu ao rolar a página
window.addEventListener('scroll', () => {
    navMenu.classList.remove('active');
});

// Fecha o menu ao clicar em qualquer link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});


// -------------------------------
// GSAP: ANIMAÇÃO DA ESTÁTUA
// -------------------------------

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

// -------------------------------
// MELHORIA: SUAVIZAÇÃO NO SCROLL DE ÂNCORAS
// -------------------------------

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));

        if (target) {
            e.preventDefault();
            window.scrollTo({
                top: target.offsetTop - 60,
                behavior: "smooth"
            });
        }
    });
});
