document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();

    // Remove active highlight from all links
    document.querySelectorAll('.header__link').forEach((l) => l.classList.remove('header__link--active'));

    // Highlight the corresponding link if it exists and is not the home section
    if (targetId !== '#home') {
      const navLink = document.querySelector(`.header__link[href="${targetId}"]`);
      if (navLink) {
        navLink.classList.add('header__link--active');
      }
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const navLinks = document.querySelectorAll('.header__link');
const sections = ['home', 'about', 'packages', 'services', 'reviews', 'contact'].map((id) =>
  document.getElementById(id)
);

window.addEventListener('scroll', () => {
  // Sticky header shrink state toggle
  const header = document.querySelector('.header');
  if (header) {
    if (window.scrollY > 50) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  }

  const scrollPos = window.scrollY + 120;

  // Check if we are in the home section
  const aboutSection = document.getElementById('about');
  if (aboutSection && window.scrollY < aboutSection.offsetTop - 150) {
    navLinks.forEach((l) => l.classList.remove('header__link--active'));
    return;
  }

  sections.forEach((section, index) => {
    if (!section || section.id === 'home') return;
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;
    const link = navLinks[index];
    if (!link) return;

    if (scrollPos >= top && scrollPos < bottom) {
      navLinks.forEach((l) => l.classList.remove('header__link--active'));
      link.classList.add('header__link--active');
    }
  });
});

// ─── Scroll-Driven Sticky Background Canvas Animation ───
const canvas = document.getElementById('scroll-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const frameCount = 40;
  const frames = [];
  let loadedFrames = 0;

  // Title morph/FLIP coordinates and scale
  let titleRect = null;
  let slotRect = null;
  const targetScale = 0.52; // Scale factor to shrink Hero title to About section text size

  function measureTitleTransition() {
    const title = document.getElementById('animated-title');
    const slot = document.getElementById('about-title-slot');
    if (!title || !slot) return;

    // Reset transform to measure base coordinates accurately
    const originalTransform = title.style.transform;
    title.style.transform = 'none';

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const tRect = title.getBoundingClientRect();
    const sRect = slot.getBoundingClientRect();

    titleRect = {
      left: tRect.left + scrollX,
      top: tRect.top + scrollY,
      width: tRect.width,
      height: tRect.height
    };

    slotRect = {
      left: sRect.left + scrollX,
      top: sRect.top + scrollY,
      width: sRect.width,
      height: sRect.height
    };

    // Restore original transform
    title.style.transform = originalTransform;
  }

  function updateTitleTransition(scrollY) {
    if (!titleRect || !slotRect) return;

    const title = document.getElementById('animated-title');
    const aboutSection = document.getElementById('about');
    if (!title || !aboutSection) return;

    const aboutTop = aboutSection.offsetTop;
    const progress = Math.min(Math.max(scrollY / aboutTop, 0), 1);

    // Calculate dynamic translations and scale
    const deltaX = slotRect.left - titleRect.left;
    const deltaY = slotRect.top - titleRect.top;

    const x = deltaX * progress;
    const y = deltaY * progress;
    const scale = 1 - (1 - targetScale) * progress;

    title.style.transformOrigin = 'left top';
    title.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }

  // Preloading progress UI & frame caching
  const preloader = document.getElementById('preloader');
  const percentEl = document.getElementById('preloader-percent');

  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    const frameNum = String(i).padStart(3, '0');
    img.src = `assets/images/animation/frame-${frameNum}.jpg`;
    img.onload = () => {
      loadedFrames++;
      
      // Update loading percentage text
      if (percentEl) {
        const percent = Math.floor((loadedFrames / frameCount) * 100);
        percentEl.textContent = `${percent}%`;
      }
      
      // Once fully loaded, fade out preloader and boot animation
      if (loadedFrames === frameCount) {
        if (preloader) {
          preloader.classList.add('fade-out');
        }
        // Draw initial state
        drawFrame(0);
      }
    };
    frames.push(img);
  }

  // Draw frame on canvas with object-fit: cover behavior
  function drawFrame(progress) {
    const frameIndex = Math.min(
      Math.max(Math.floor(progress * (frameCount - 1)), 0),
      frameCount - 1
    );
    const img = frames[frameIndex];
    if (!img || !img.complete) return;

    // Set canvas dimensions
    const canvasWidth = canvas.width = window.innerWidth;
    const canvasHeight = canvas.height = window.innerHeight;

    // Object-fit cover math
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      drawX = 0;
      drawY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      drawHeight = canvasHeight;
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = 0;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  // Smooth scroll interpolation (Lerp) engine
  let targetScrollY = window.scrollY;
  let currentScrollY = window.scrollY;
  let isAnimating = false;
  const lerpFactor = 0.08; // Smoothness factor (0.08 = 8% of target distance per frame)

  const statsSection = document.querySelector('.stats');
  const overlay = document.querySelector('.scroll-overlay');

  function tick() {
    // Lerp progress calculation
    const diff = targetScrollY - currentScrollY;
    if (Math.abs(diff) > 0.1) {
      currentScrollY += diff * lerpFactor;
      isAnimating = true;
    } else {
      currentScrollY = targetScrollY;
      isAnimating = false;
    }

    if (statsSection) {
      const statsTop = statsSection.offsetTop;
      const progress = Math.min(Math.max(currentScrollY / statsTop, 0), 1);

      drawFrame(progress);

      // Fade out overlay based on current progress
      if (overlay) {
        overlay.style.opacity = Math.max(1 - progress * 1.67, 0);
      }
    }

    // Update title animation inside smooth tick loop
    updateTitleTransition(currentScrollY);

    // Keep ticking if we haven't reached the target
    if (isAnimating) {
      requestAnimationFrame(tick);
    }
  }

  function onScroll() {
    targetScrollY = window.scrollY;
    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(tick);
    }
  }

  window.addEventListener('scroll', onScroll);

  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;

    measureTitleTransition();
    // Redraw current state on resize
    if (statsSection) {
      const statsTop = statsSection.offsetTop;
      const progress = Math.min(Math.max(currentScrollY / statsTop, 0), 1);
      drawFrame(progress);
    }
    updateTitleTransition(currentScrollY);
  });

  window.addEventListener('load', () => {
    measureTitleTransition();
    updateTitleTransition(window.scrollY);
  });

  // Fallback initial draw
  setTimeout(() => {
    measureTitleTransition();
    targetScrollY = window.scrollY;
    currentScrollY = window.scrollY;
    onScroll();
  }, 200);
}

// ─── Stats Number Counter & Entry Reveal Animation ───
const statsEl = document.querySelector('.stats');
if (statsEl) {
  const statCards = statsEl.querySelectorAll('.stat');
  const statNumbers = statsEl.querySelectorAll('.stat__number');

  const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // 1. Reveal cards with staggered transitions
        statCards.forEach((card) => card.classList.add('visible'));

        // 2. Animate counter numbers
        statNumbers.forEach((el) => {
          const target = parseInt(el.textContent, 10);
          if (isNaN(target)) return;

          let start = 0;
          const duration = 2000; // 2 seconds animation
          const startTime = performance.now();

          function updateCount(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic: deceleration to make it feel natural
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeProgress * target);

            el.textContent = currentVal;

            if (progress < 1) {
              requestAnimationFrame(updateCount);
            } else {
              el.textContent = target; // Final snap to exact value
            }
          }

          // Initial reset to 0 before starting count
          el.textContent = '0';
          requestAnimationFrame(updateCount);
        });

        // Unobserve after running once
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15 // Triggers when 15% of the stats section is in view
  });

  statsObserver.observe(statsEl);
}

// ─── Dynamic WhatsApp CTA insertion for Package Cards ───
document.querySelectorAll('.package-card').forEach((card) => {
  const infoEl = card.querySelector('.package-card__info');
  if (!infoEl) return;

  const titleEl = infoEl.querySelector('h3');
  const packageName = titleEl ? titleEl.textContent : 'Travel';

  // Create CTA link element
  const cta = document.createElement('a');
  cta.className = 'package-card__cta';
  cta.href = `https://wa.me/971504274260?text=Hi,%20I'm%20interested%20in%20the%20${encodeURIComponent(packageName)}%20package.`;
  cta.target = '_blank';

  // Set inner HTML (Text + SVG icon)
  cta.innerHTML = `
    <span>Enquire on WhatsApp</span>
    <img src="assets/icons/whatsapp.svg" alt="WhatsApp">
  `;

  infoEl.appendChild(cta);
});

// ─── Hamburger Menu Mobile Drawer Toggle ───
const menuToggle = document.getElementById('menu-toggle');
const headerNav = document.getElementById('header-nav');

if (menuToggle && headerNav) {
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menuToggle.classList.toggle('active');
    headerNav.classList.toggle('header__nav--open');
  });

  // Close menu when clicking on any link
  document.querySelectorAll('.header__link').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      headerNav.classList.remove('header__nav--open');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (headerNav.classList.contains('header__nav--open') && 
        !headerNav.contains(e.target) && 
        !menuToggle.contains(e.target)) {
      menuToggle.classList.remove('active');
      headerNav.classList.remove('header__nav--open');
    }
  });
}

// ─── Package Cards Scroll Entrance Animation (One-by-one on Scroll) ───
const packageCards = document.querySelectorAll('.package-card');
if (packageCards.length > 0) {
  const cardObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  packageCards.forEach((card) => {
    cardObserver.observe(card);
  });
}

// ─── Service Cards Scroll Entrance Animation (One-by-one on Scroll) ───
const serviceCards = document.querySelectorAll('.service-card');
if (serviceCards.length > 0) {
  const serviceObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  serviceCards.forEach((card) => {
    serviceObserver.observe(card);
  });
}

// ─── Dynamic WhatsApp CTA insertion for Service Cards ───
document.querySelectorAll('.service-card').forEach((card) => {
  const titleEl = card.querySelector('h3');
  const serviceName = titleEl ? titleEl.textContent : 'Service';

  // Create CTA link element
  const cta = document.createElement('a');
  cta.className = 'service-card__cta';
  cta.href = `https://wa.me/971504274260?text=Hi,%20I'm%20interested%20in%20your%20${encodeURIComponent(serviceName)}%20service.`;
  cta.target = '_blank';

  // Set inner HTML (Text + SVG icon)
  cta.innerHTML = `
    <span>Enquire on WhatsApp</span>
    <img src="assets/icons/whatsapp.svg" alt="WhatsApp">
  `;

  card.appendChild(cta);
});

