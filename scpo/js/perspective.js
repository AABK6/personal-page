/**
 * Perspective Switcher implementation.
 * Provides a toggle switch for highly contested topics to change background tint
 * and highlight different quotes/arguments based on selected worldview.
 */

const PerspectiveStyles = `
/* Core perspective styles */
.perspective-section {
  transition: background-color 0.5s ease;
}

/* Background tints */
.perspective-section[data-active-perspective="washington"] {
  background-color: rgba(59, 130, 246, 0.05); /* Blue tint */
}
.perspective-section[data-active-perspective="brazil"] {
  background-color: rgba(34, 197, 94, 0.05); /* Green tint */
}
.perspective-section[data-active-perspective="china"] {
  background-color: rgba(220, 38, 38, 0.05); /* Red tint */
}
.perspective-section[data-active-perspective="eu"] {
  background-color: rgba(245, 158, 11, 0.05); /* Gold tint */
}

/* UI Controls */
.perspective-controls {
  display: flex;
  gap: 0.5rem;
  background: rgba(15, 23, 42, 0.5);
  padding: 0.5rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: fit-content;
}

.perspective-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted, #94a3b8);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: capitalize;
}

.perspective-btn:hover {
  color: #f8fafc;
}

.perspective-btn.active {
  background: var(--color-primary-700, #334155);
  color: #f8fafc;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Hide inactive perspectives */
.perspective-content {
  display: none;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.perspective-content.active {
  display: block;
  opacity: 1;
}

/* Support for inline highlights instead of full block toggles */
.perspective-highlight {
  transition: background-color 0.3s ease, color 0.3s ease;
  padding: 0 0.2rem;
  border-radius: 0.25rem;
}

.perspective-section[data-active-perspective="washington"] .perspective-highlight[data-perspective="washington"] {
  background-color: rgba(59, 130, 246, 0.3);
  color: #fff;
}
.perspective-section[data-active-perspective="brazil"] .perspective-highlight[data-perspective="brazil"] {
  background-color: rgba(34, 197, 94, 0.3);
  color: #fff;
}
`;

function injectPerspectiveStyles() {
  if (document.getElementById('perspective-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'perspective-styles';
  styleEl.textContent = PerspectiveStyles;
  document.head.appendChild(styleEl);
}

function initPerspectiveSwitchers() {
  injectPerspectiveStyles();

  const sections = document.querySelectorAll('.perspective-section');

  sections.forEach(section => {
    if (section.hasAttribute('data-perspective-initialized')) return;
    section.setAttribute('data-perspective-initialized', 'true');

    const rawPerspectives = section.getAttribute('data-perspectives');
    if (!rawPerspectives) return;
    
    const perspectives = rawPerspectives.split(',').map(p => p.trim());
    const controlsContainer = section.querySelector('.perspective-controls');
    
    if (!controlsContainer) return;

    // Create buttons
    perspectives.forEach((p, index) => {
      const btn = document.createElement('button');
      btn.className = 'perspective-btn';
      btn.textContent = `View from ${p}`;
      btn.setAttribute('data-perspective', p);
      
      // Default to first perspective if none is active
      if (index === 0) {
        btn.classList.add('active');
        section.setAttribute('data-active-perspective', p);
      }

      btn.addEventListener('click', () => {
        // Update buttons
        controlsContainer.querySelectorAll('.perspective-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update section attribute for CSS tinting
        section.setAttribute('data-active-perspective', p);
        
        // Update block contents
        section.querySelectorAll('.perspective-content').forEach(content => {
          if (content.classList.contains(p)) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });
      });

      controlsContainer.appendChild(btn);
    });

    // Initialize content visibility
    const defaultP = perspectives[0];
    section.querySelectorAll('.perspective-content').forEach(content => {
      if (content.classList.contains(defaultP)) {
        content.classList.add('active');
      }
    });
  });
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.initPerspectiveSwitchers = initPerspectiveSwitchers;

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initPerspectiveSwitchers();
  });
}
