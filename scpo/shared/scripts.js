/**
 * ============================================================================
 * AI GEOPOLITICS - SHARED JAVASCRIPT UTILITIES
 * ============================================================================
 * Core JavaScript utilities for the scrolly-telling website.
 * 
 * Features:
 * - Lucide icons initialization
 * - GSAP ScrollTrigger setup
 * - Smooth scroll helper
 * - IntersectionObserver utility
 * - Mobile menu toggle
 * - Progress indicator update
 * - Animation helper functions
 * ============================================================================
 */

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize all components when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  initLucideIcons();
  initGSAP();
  initMobileMenu();
  initScrollProgress();
  initBackToTop();
  initSmoothScroll();
  initNavigationHighlight();
  initChapterRail();
  initRevealAnimations();
  initTimelineVisibilityGuard();
});

// ============================================================================
// LUCIDE ICONS
// ============================================================================

/**
 * Initialize Lucide icons throughout the page
 */
function initLucideIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  } else {
    console.warn('Lucide library not loaded');
  }
}

/**
 * Re-initialize Lucide icons (useful after dynamic content insertion)
 */
function refreshIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ============================================================================
// GSAP & SCROLLTRIGGER SETUP
// ============================================================================

/**
 * Initialize GSAP and ScrollTrigger
 */
function initGSAP() {
  // Check if GSAP is loaded
  if (typeof gsap === 'undefined') {
    console.warn('GSAP library not loaded');
    return;
  }

  // Register ScrollTrigger plugin
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Set default GSAP settings
  gsap.defaults({
    ease: 'power3.out',
    duration: 0.8
  });

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Make animations instant instead of freezing at initial hidden states
    gsap.defaults({
      duration: 0,
      ease: 'none'
    });
    return;
  }

  // Slow reveal animations slightly so motion is readable while scrolling
  gsap.globalTimeline.timeScale(0.75);
}

/**
 * Create a scroll-triggered animation
 * @param {string|Element} target - Element(s) to animate
 * @param {Object} animation - GSAP animation properties
 * @param {Object} scrollTrigger - ScrollTrigger configuration
 */
function createScrollAnimation(target, animation, scrollTrigger = {}) {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not loaded');
    return;
  }

  const defaultScrollTrigger = {
    trigger: target,
    start: 'top 80%',
    end: 'bottom 20%',
    toggleActions: 'play none none none',
    ...scrollTrigger
  };

  return gsap.from(target, {
    ...animation,
    scrollTrigger: defaultScrollTrigger
  });
}

/**
 * Create a parallax effect
 * @param {string|Element} target - Element to apply parallax
 * @param {number} speed - Parallax speed (negative = slower, positive = faster)
 */
function createParallax(target, speed = 0.5) {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not loaded');
    return;
  }

  gsap.to(target, {
    yPercent: speed * 100,
    ease: 'none',
    scrollTrigger: {
      trigger: target,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    }
  });
}

/**
 * Create a pinned section animation
 * @param {string|Element} trigger - Trigger element
 * @param {Array} animations - Array of animation configurations
 */
function createPinnedSection(trigger, animations) {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not loaded');
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: trigger,
      start: 'top top',
      end: '+=200%',
      pin: true,
      scrub: 1,
      snap: {
        snapTo: 'labels',
        duration: { min: 0.2, max: 0.5 },
        delay: 0.1
      }
    }
  });

  animations.forEach((anim, index) => {
    tl.addLabel(`step${index}`);
    tl.from(anim.target, anim.props, anim.position || '>');
  });

  return tl;
}

// ============================================================================
// SMOOTH SCROLL
// ============================================================================

/**
 * Initialize smooth scroll for anchor links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        smoothScrollTo(target);
      }
    });
  });
}

/**
 * Smooth scroll to an element
 * @param {Element|string} target - Target element or selector
 * @param {number} offset - Offset from top (default: 80px for nav height)
 * @param {number} duration - Animation duration in ms
 */
function smoothScrollTo(target, offset = 80, duration = 800) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  
  if (!element) {
    console.warn('Smooth scroll target not found:', target);
    return;
  }

  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;

  const hasGsapScrollTo =
    typeof gsap !== 'undefined' &&
    gsap.plugins &&
    gsap.plugins.ScrollToPlugin;

  // Prefer GSAP smooth scrolling only when ScrollToPlugin is available.
  if (hasGsapScrollTo) {
    gsap.to(window, {
      duration: duration / 1000,
      scrollTo: { y: targetPosition, autoKill: false },
      ease: 'power3.inOut'
    });
    return;
  }

  // Fallback to native smooth scroll
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
}

// ============================================================================
// INTERSECTION OBSERVER UTILITY
// ============================================================================

/**
 * Create an IntersectionObserver for reveal animations
 * @param {string} selector - CSS selector for elements to observe
 * @param {Object} options - IntersectionObserver options
 * @param {Function} callback - Callback when element intersects
 */
function createIntersectionObserver(selector, options = {}, callback) {
  const defaultOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1,
    ...options
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        // Optionally unobserve after first intersection
        // observer.unobserve(entry.target);
      }
    });
  }, defaultOptions);

  document.querySelectorAll(selector).forEach(el => observer.observe(el));

  return observer;
}

/**
 * Initialize reveal-on-scroll animations using IntersectionObserver
 */
function initRevealAnimations() {
  createIntersectionObserver('.reveal-on-scroll', {}, (element) => {
    element.classList.add('is-visible');
  });
}

/**
 * Force visible timeline content when it enters viewport.
 * Prevents timeline rows from staying hidden due conflicting ScrollTriggers.
 */
function initTimelineVisibilityGuard() {
  const selector = '.timeline-item, .timeline-event, .timeline-case, .gsap-timeline-item';
  const elements = Array.from(document.querySelectorAll(selector));

  if (elements.length === 0) return;

  const repairDelayMs = 1400;
  const repairTimers = new WeakMap();

  const forceVisible = (element) => {
    const style = window.getComputedStyle(element);
    const opacity = parseFloat(style.opacity || '1');

    if (opacity >= 0.98 && style.transform === 'none') return;

    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(element);
      gsap.set(element, { opacity: 1, x: 0, y: 0, clearProps: 'transform,opacity' });
    } else {
      element.style.opacity = '1';
      element.style.transform = 'none';
    }
  };

  const scheduleRepairCheck = (element) => {
    if (repairTimers.has(element)) return;

    const timerId = setTimeout(() => {
      repairTimers.delete(element);

      const style = window.getComputedStyle(element);
      const opacity = parseFloat(style.opacity || '1');
      const hasTransform = style.transform !== 'none';
      const tweening = typeof gsap !== 'undefined' && typeof gsap.isTweening === 'function' && gsap.isTweening(element);

      // Only repair elements that are still hidden after enough time to animate naturally.
      if (!tweening && (opacity < 0.85 || hasTransform)) {
        forceVisible(element);
      }
    }, repairDelayMs);

    repairTimers.set(element, timerId);
  };

  const clearRepairCheck = (element) => {
    const timerId = repairTimers.get(element);
    if (timerId) {
      clearTimeout(timerId);
      repairTimers.delete(element);
    }
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        scheduleRepairCheck(entry.target);
      } else {
        clearRepairCheck(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -2% 0px',
    threshold: 0
  });

  elements.forEach((element) => observer.observe(element));
}

/**
 * Check if an element is in the viewport
 * @param {Element} element - Element to check
 * @param {number} offset - Offset from viewport edges
 * @returns {boolean}
 */
function isInViewport(element, offset = 0) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// ============================================================================
// MOBILE MENU
// ============================================================================

/**
 * Initialize mobile menu toggle functionality
 */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (!menuBtn || !mobileMenu) return;

  const menuIcon = menuBtn.querySelector('.menu-icon');
  const closeIcon = menuBtn.querySelector('.close-icon');

  menuBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('translate-y-0');
    
    if (isOpen) {
      closeMobileMenu(mobileMenu, menuBtn, menuIcon, closeIcon);
    } else {
      openMobileMenu(mobileMenu, menuBtn, menuIcon, closeIcon);
    }
  });

  // Close menu when clicking on a link
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu(mobileMenu, menuBtn, menuIcon, closeIcon);
    });
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('translate-y-0')) {
      closeMobileMenu(mobileMenu, menuBtn, menuIcon, closeIcon);
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (
      mobileMenu.classList.contains('translate-y-0') &&
      !mobileMenu.contains(e.target) &&
      !menuBtn.contains(e.target)
    ) {
      closeMobileMenu(mobileMenu, menuBtn, menuIcon, closeIcon);
    }
  });
}

/**
 * Open mobile menu
 */
function openMobileMenu(menu, btn, menuIcon, closeIcon) {
  menu.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none');
  menu.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
  menu.setAttribute('aria-hidden', 'false');
  
  btn.setAttribute('aria-expanded', 'true');
  
  if (menuIcon) menuIcon.classList.add('hidden');
  if (closeIcon) closeIcon.classList.remove('hidden');
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

/**
 * Close mobile menu
 */
function closeMobileMenu(menu, btn, menuIcon, closeIcon) {
  menu.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
  menu.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
  menu.setAttribute('aria-hidden', 'true');
  
  btn.setAttribute('aria-expanded', 'false');
  
  if (menuIcon) menuIcon.classList.remove('hidden');
  if (closeIcon) closeIcon.classList.add('hidden');
  
  // Restore body scroll
  document.body.style.overflow = '';
}

// ============================================================================
// SCROLL PROGRESS INDICATOR
// ============================================================================

/**
 * Initialize scroll progress indicator
 */
function initScrollProgress() {
  const progressBar = document.getElementById('scroll-progress');
  const navProgressBar = document.getElementById('nav-progress-bar');
  const mobileProgressBar = document.getElementById('mobile-progress-bar');
  const progressPercentage = document.getElementById('progress-percentage');
  const mobileProgressPercentage = document.getElementById('mobile-progress-percentage');

  // Use requestAnimationFrame for smooth updates
  let ticking = false;

  function updateProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    // Update all progress indicators
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (navProgressBar) navProgressBar.style.width = `${progress}%`;
    if (mobileProgressBar) mobileProgressBar.style.width = `${progress}%`;
    
    // Update percentage text
    const percentageText = `${Math.round(progress)}%`;
    if (progressPercentage) progressPercentage.textContent = percentageText;
    if (mobileProgressPercentage) mobileProgressPercentage.textContent = percentageText;

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });

  // Initial update
  updateProgress();
}

/**
 * Get current scroll progress as percentage
 * @returns {number}
 */
function getScrollProgress() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
}

// ============================================================================
// NAVIGATION HIGHLIGHT
// ============================================================================

/**
 * Initialize navigation highlight based on scroll position
 */
function initNavigationHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  if (sections.length === 0 || navLinks.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        
        navLinks.forEach(link => {
          link.classList.remove('text-[var(--color-tech-cyan)]', 'bg-[var(--color-bg-tertiary)]');
          
          if (link.getAttribute('data-section') === id || link.getAttribute('href') === `#${id}`) {
            link.classList.add('text-[var(--color-tech-cyan)]', 'bg-[var(--color-bg-tertiary)]');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

// ============================================================================
// CHAPTER RAIL
// ============================================================================

/**
 * Initialize sticky chapter rail navigation
 */
function initChapterRail() {
  const rail = document.querySelector('.chapter-rail');
  if (!rail) return;

  const railLinks = Array.from(rail.querySelectorAll('.chapter-rail__link'));
  if (railLinks.length === 0) return;

  const progressEl = document.getElementById('chapter-rail-progress');

  const nav = document.querySelector('.nav-fixed');
  const orientation = progressEl?.dataset.orientation || 'vertical';
  const trackCount = railLinks.length;
  const dotSpanRatio = trackCount > 1 ? (trackCount - 1) / trackCount : 1;
  const progressSegments = trackCount;

  rail.style.setProperty('--chapter-rail-dot-span', `${dotSpanRatio * 100}%`);

  const targetEntries = railLinks
    .map((link) => {
      const id = link.getAttribute('data-section') || (link.getAttribute('href') || '').replace('#', '');
      if (!id) return null;
      const target = document.getElementById(id);
      if (!target) return null;
      return { link, id, target };
    })
    .filter(Boolean);

  if (targetEntries.length === 0) return;

  const setProgress = (value) => {
    if (!progressEl) return;
    const clamped = Math.max(0, Math.min(100, value));
    if (orientation === 'horizontal') {
      progressEl.style.width = `${clamped}%`;
    } else {
      progressEl.style.height = `${clamped}%`;
    }
  };

  const getNavOffset = () => (nav ? nav.offsetHeight + 8 : 80);
  const getTargetTop = (target) => target.getBoundingClientRect().top + window.pageYOffset;

  function setActive(id) {
    railLinks.forEach((link) => {
      const linkId = link.getAttribute('data-section') || (link.getAttribute('href') || '').replace('#', '');
      const isActive = linkId === id;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  const getRailStateFromScroll = () => {
    // Align progress/active state to the section currently under the fixed header.
    const marker = window.pageYOffset + getNavOffset() + 2;
    const lastIndex = targetEntries.length - 1;

    if (window.pageYOffset <= 2) {
      return { index: 0, progress: 0 };
    }

    let index = 0;
    for (let i = 0; i < targetEntries.length; i += 1) {
      if (marker >= getTargetTop(targetEntries[i].target)) {
        index = i;
      } else {
        break;
      }
    }

    if (trackCount <= 1 || lastIndex <= 0) {
      return { index, progress: 100 };
    }

    if (index >= lastIndex) {
      const currentTop = getTargetTop(targetEntries[lastIndex].target);
      const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const bottomMarker = maxScrollY + getNavOffset() + 2;
      const segmentSize = Math.max(1, bottomMarker - currentTop);
      const segmentProgress = Math.max(0, Math.min(1, (marker - currentTop) / segmentSize));
      const progress = ((lastIndex + segmentProgress) / progressSegments) * 100;
      return { index, progress };
    }

    const currentTop = getTargetTop(targetEntries[index].target);
    const nextTop = getTargetTop(targetEntries[index + 1].target);
    const segmentSize = Math.max(1, nextTop - currentTop);
    const segmentProgress = Math.max(0, Math.min(1, (marker - currentTop) / segmentSize));
    const progress = ((index + segmentProgress) / progressSegments) * 100;

    return { index, progress };
  };

  const updateRailUI = () => {
    const { index, progress } = getRailStateFromScroll();
    setActive(targetEntries[index].id);
    setProgress(progress);
  };

  function scrollRailToId(id) {
    if (!id) return;
    const entry = targetEntries.find((item) => item.id === id);
    if (!entry) return;

    const y = getTargetTop(entry.target) - getNavOffset();

    window.scrollTo({
      top: Math.max(0, y),
      behavior: 'smooth'
    });

    setActive(id);
    const clickedIndex = targetEntries.indexOf(entry);
    const clickedProgress = trackCount > 0 ? (clickedIndex / trackCount) * 100 : 100;
    setProgress(clickedProgress);
  }

  railLinks.forEach((link) => {
    const id = link.getAttribute('data-section') || (link.getAttribute('href') || '').replace('#', '');
    if (!id) return;

    // Use capture phase to make chapter rail navigation deterministic.
    link.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      scrollRailToId(id);
    }, { capture: true });
  });

  rail.addEventListener('click', (event) => {
    // If user clicked directly on a dot/link, dedicated handlers above handle it.
    const clickTarget = event.target;
    if (clickTarget instanceof Element && clickTarget.closest('.chapter-rail__link')) return;

    const rect = rail.getBoundingClientRect();
    if (!rect.width) return;

    const spanWidth = rect.width * dotSpanRatio;
    const x = event.clientX - rect.left;
    const ratioInDots = spanWidth > 0
      ? Math.min(1, Math.max(0, x / spanWidth))
      : 1;
    const index = x > spanWidth
      ? railLinks.length - 1
      : Math.round(ratioInDots * (railLinks.length - 1));
    const nearest = railLinks[index];
    if (!nearest) return;

    const id = nearest.getAttribute('data-section') || (nearest.getAttribute('href') || '').replace('#', '');
    scrollRailToId(id);
  });

  let ticking = false;
  const requestRailUpdate = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(() => {
        updateRailUI();
        ticking = false;
      });
    }
  };

  window.addEventListener('scroll', requestRailUpdate, { passive: true });
  window.addEventListener('resize', requestRailUpdate);
  updateRailUI();
}

// ============================================================================
// BACK TO TOP
// ============================================================================

/**
 * Initialize back to top button
 */
function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');
  
  if (!backToTopBtn) return;

  // Show/hide button based on scroll position
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 500) {
      backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
      backToTopBtn.classList.add('opacity-100', 'pointer-events-auto');
    } else {
      backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
      backToTopBtn.classList.remove('opacity-100', 'pointer-events-auto');
    }
  }, { passive: true });

  // Scroll to top on click
  backToTopBtn.addEventListener('click', () => {
    if (typeof gsap !== 'undefined') {
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: 0 },
        ease: 'power3.inOut'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  });
}

// ============================================================================
// ANIMATION HELPERS
// ============================================================================

/**
 * Fade in an element
 * @param {Element|string} target - Element or selector
 * @param {number} duration - Animation duration in seconds
 * @param {number} delay - Animation delay in seconds
 */
function fadeIn(target, duration = 0.6, delay = 0) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(element, 
      { opacity: 0 },
      { opacity: 1, duration, delay, ease: 'power2.out' }
    );
  } else {
    element.style.opacity = '0';
    setTimeout(() => {
      element.style.transition = `opacity ${duration}s ease`;
      element.style.opacity = '1';
    }, delay * 1000);
  }
}

/**
 * Slide in an element from a direction
 * @param {Element|string} target - Element or selector
 * @param {string} direction - Direction: 'up', 'down', 'left', 'right'
 * @param {number} duration - Animation duration in seconds
 * @param {number} delay - Animation delay in seconds
 */
function slideIn(target, direction = 'up', duration = 0.6, delay = 0) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;

  const distance = 50;
  const fromVars = { opacity: 0 };

  switch (direction) {
    case 'up': fromVars.y = distance; break;
    case 'down': fromVars.y = -distance; break;
    case 'left': fromVars.x = distance; break;
    case 'right': fromVars.x = -distance; break;
  }

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(element, fromVars, {
      opacity: 1,
      x: 0,
      y: 0,
      duration,
      delay,
      ease: 'power3.out'
    });
  } else {
    element.style.opacity = '0';
    element.style.transform = `translate(${fromVars.x || 0}px, ${fromVars.y || 0}px)`;
    setTimeout(() => {
      element.style.transition = `all ${duration}s ease`;
      element.style.opacity = '1';
      element.style.transform = 'translate(0, 0)';
    }, delay * 1000);
  }
}

/**
 * Stagger animation for multiple elements
 * @param {string} selector - CSS selector for elements
 * @param {string} animation - Animation type: 'fadeIn', 'slideUp', 'slideLeft', 'slideRight'
 * @param {number} stagger - Stagger delay between elements
 * @param {number} duration - Animation duration
 */
function staggerAnimation(selector, animation = 'fadeIn', stagger = 0.1, duration = 0.6) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) return;

  if (typeof gsap !== 'undefined') {
    const fromVars = { opacity: 0 };
    
    switch (animation) {
      case 'slideUp': fromVars.y = 30; break;
      case 'slideDown': fromVars.y = -30; break;
      case 'slideLeft': fromVars.x = 30; break;
      case 'slideRight': fromVars.x = -30; break;
    }

    gsap.from(elements, {
      ...fromVars,
      opacity: 0,
      duration,
      stagger,
      ease: 'power3.out'
    });
  } else {
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = `opacity ${duration}s ease`;
        el.style.opacity = '1';
      }, index * stagger * 1000);
    });
  }
}

/**
 * Create a typewriter effect
 * @param {Element|string} target - Element or selector
 * @param {string} text - Text to type
 * @param {number} speed - Typing speed in ms per character
 */
function typewriter(target, text, speed = 50) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;

  element.textContent = '';
  let i = 0;

  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }

  type();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
function debounce(func, wait = 100) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit time in ms
 * @returns {Function}
 */
function throttle(func, limit = 100) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if device is touch-enabled
 * @returns {boolean}
 */
function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Get viewport dimensions
 * @returns {Object}
 */
function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

// ============================================================================
// EXPORT FOR MODULE SYSTEMS (Optional)
// ============================================================================

// If using ES modules, uncomment below:
// export {
//   initLucideIcons,
//   refreshIcons,
//   createScrollAnimation,
//   createParallax,
//   createPinnedSection,
//   smoothScrollTo,
//   createIntersectionObserver,
//   isInViewport,
//   fadeIn,
//   slideIn,
//   staggerAnimation,
//   typewriter,
//   debounce,
//   throttle,
//   isTouchDevice,
//   getViewport,
//   getScrollProgress
// };
