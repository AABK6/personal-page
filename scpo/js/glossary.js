/**
 * Inline Concept Glossary implementation.
 * Adds a glassmorphism tooltip to key terms with definitions.
 */

const GlossaryStyles = `
.glossary-term {
  position: relative;
  display: inline-block;
  cursor: pointer;
  border-bottom: 1px dotted var(--color-secondary-400, #f97316);
  transition: color 0.2s ease, border-color 0.2s ease;
}

.glossary-term:hover, .glossary-term.active {
  color: var(--color-secondary-400, #f97316);
  border-bottom-style: solid;
}

/* Tooltip container */
.glossary-tooltip {
  position: absolute;
  bottom: calc(100% + 10px); /* Position above the term */
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  width: max-content;
  max-width: 250px;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #f8fafc;
  font-family: var(--font-body, sans-serif);
  font-size: 0.85rem;
  line-height: 1.5;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 100;
  pointer-events: none;
}

/* Small arrow pointing down */
.glossary-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: rgba(15, 23, 42, 0.85) transparent transparent transparent;
}

/* Show tooltip on hover or when active */
.glossary-term:hover .glossary-tooltip,
.glossary-term.active .glossary-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

/* Adjust position if near right edge */
.glossary-tooltip.align-right {
  left: auto;
  right: -10px;
  transform: translateY(10px);
}
.glossary-term:hover .glossary-tooltip.align-right,
.glossary-term.active .glossary-tooltip.align-right {
  transform: translateY(0);
}
.glossary-tooltip.align-right::after {
  left: auto;
  right: 20px;
}

/* Adjust position if near left edge */
.glossary-tooltip.align-left {
  left: -10px;
  transform: translateY(10px);
}
.glossary-term:hover .glossary-tooltip.align-left,
.glossary-term.active .glossary-tooltip.align-left {
  transform: translateY(0);
}
.glossary-tooltip.align-left::after {
  left: 20px;
}
`;

function injectGlossaryStyles() {
  if (document.getElementById('glossary-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'glossary-styles';
  styleEl.textContent = GlossaryStyles;
  document.head.appendChild(styleEl);
}

function initGlossary() {
  injectGlossaryStyles();

  const terms = document.querySelectorAll('.glossary-term');

  terms.forEach(term => {
    // Prevent double initialization
    if (term.querySelector('.glossary-tooltip')) return;

    const definition = term.getAttribute('data-definition');
    if (!definition) return;

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'glossary-tooltip';
    tooltip.textContent = definition;
    
    // Add to term
    term.appendChild(tooltip);

    // Handle viewport edge collisions
    const checkPosition = () => {
      const rect = term.getBoundingClientRect();
      tooltip.classList.remove('align-left', 'align-right');
      
      // Assume max width is 250px
      if (rect.left < 125) {
        tooltip.classList.add('align-left');
      } else if (window.innerWidth - rect.right < 125) {
        tooltip.classList.add('align-right');
      }
    };

    term.addEventListener('mouseenter', checkPosition);
    term.addEventListener('focus', checkPosition);

    // Mobile tap support
    term.addEventListener('click', (e) => {
      // If clicking on a link inside term (if any), let it happen
      if (e.target.tagName === 'A') return;
      
      e.stopPropagation();
      checkPosition();
      
      // Toggle active state
      const isActive = term.classList.contains('active');
      
      // Close all others
      document.querySelectorAll('.glossary-term.active').forEach(t => {
        t.classList.remove('active');
      });

      if (!isActive) {
        term.classList.add('active');
      }
    });
  });

  // Close tooltips when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.glossary-term.active').forEach(t => {
      t.classList.remove('active');
    });
  });
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.initGlossary = initGlossary;

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initGlossary();
  });
}
