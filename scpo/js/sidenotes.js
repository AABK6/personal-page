/**
 * Tufte-style sidenotes implementation.
 */

const SidenoteStyles = `
/* Tufte Sidenote Core Styles */
.sidenote-wrapper {
  position: relative;
  display: inline;
}

.sidenote-trigger {
  cursor: pointer;
  vertical-align: super;
  font-size: 0.75em;
  margin-left: 2px;
  background: none;
  border: none;
  padding: 0;
  color: var(--color-secondary-500, #ea580c);
  font-family: var(--font-mono, monospace);
}

.sidenote {
  /* Default Mobile State: Hidden until toggled */
  display: none;
  font-size: 0.85rem;
  line-height: 1.4;
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  background-color: rgba(30, 41, 59, 0.5); /* subtle background */
  border-left: 3px solid var(--color-secondary-500, #ea580c);
  border-radius: 4px;
  color: var(--color-text-muted, #94a3b8);
  font-family: var(--font-body, sans-serif);
}

/* When active on mobile, display inline block */
.sidenote-wrapper.active .sidenote {
  display: block;
  position: static;
  margin-bottom: 1rem;
}

/* Desktop styles: Tufte right margin */
@media (min-width: 1024px) {
  .sidenote {
    display: block;
    position: absolute;
    right: -24rem; /* Push into the right margin */
    top: 0;
    width: 20rem; /* Fixed width for notes */
    margin-top: 0;
    margin-bottom: 0;
    background-color: transparent;
    border-left: none;
    padding: 0;
    font-size: 0.8rem;
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }

  .sidenote:hover {
    opacity: 1;
  }

  .sidenote-wrapper.active .sidenote {
    display: block; /* maintain block display but in margin */
    position: absolute; /* Keep absolute */
  }
}

/* For larger screens we can push it further or make it wider if needed */
@media (min-width: 1280px) {
  .sidenote {
    right: -26rem;
    width: 22rem;
  }
}
`;

function injectSidenoteStyles() {
  if (document.getElementById('sidenote-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'sidenote-styles';
  styleEl.textContent = SidenoteStyles;
  document.head.appendChild(styleEl);
}

function initSidenotes() {
  injectSidenoteStyles();

  const triggers = document.querySelectorAll('.sidenote-trigger');
  triggers.forEach(trigger => {
    // Only attach listener once
    if (trigger.hasAttribute('data-sidenote-initialized')) return;
    trigger.setAttribute('data-sidenote-initialized', 'true');

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const wrapper = trigger.closest('.sidenote-wrapper');
      if (!wrapper) return;

      const isActive = wrapper.classList.contains('active');
      
      // Close all other sidenotes on mobile (optional, but good for UX)
      if (window.innerWidth < 1024) {
        document.querySelectorAll('.sidenote-wrapper.active').forEach(w => {
          if (w !== wrapper) {
            w.classList.remove('active');
            w.querySelector('.sidenote-trigger').setAttribute('aria-expanded', 'false');
          }
        });
      }

      // Toggle current
      if (isActive) {
        wrapper.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        wrapper.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.initSidenotes = initSidenotes;

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initSidenotes();
  });
}
