/**
 * Interactive Stack Diagram implementation.
 * Creates a 2.5D layered diagram representing the physical, logical, and application layers.
 * Highlighting and populating content based on scroll progress.
 */

const StackStyles = `
.stack-diagram {
  perspective: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.stack-layer {
  width: 100%;
  max-width: 600px;
  height: 120px;
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transform: rotateX(45deg) translateZ(0);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.stack-layer::before {
  content: attr(data-layer);
  position: absolute;
  top: -1rem;
  left: 1rem;
  font-family: var(--font-mono, monospace);
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--color-text-muted, #94a3b8);
  opacity: 0.5;
}

.stack-layer h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: #f8fafc;
  transition: color 0.4s ease;
}

.stack-layer p {
  font-size: 0.875rem;
  color: var(--color-text-muted, #94a3b8);
  transition: color 0.4s ease;
}

/* Active State */
.stack-layer.active {
  background: rgba(51, 65, 85, 0.8);
  border-color: var(--color-primary-500, #3b82f6);
  transform: rotateX(0deg) translateZ(50px) scale(1.05);
  box-shadow: 0 30px 60px rgba(59, 130, 246, 0.2);
  z-index: 10;
}

.stack-layer.active h3 {
  color: var(--color-primary-400, #60a5fa);
}

.stack-layer.active p {
  color: #f1f5f9;
}

/* Layer Specific Tints */
.stack-layer.physical.active { border-color: #f97316; box-shadow: 0 30px 60px rgba(249, 115, 22, 0.2); }
.stack-layer.physical.active h3 { color: #fb923c; }

.stack-layer.logical.active { border-color: #3b82f6; box-shadow: 0 30px 60px rgba(59, 130, 246, 0.2); }
.stack-layer.logical.active h3 { color: #60a5fa; }

.stack-layer.application.active { border-color: #a855f7; box-shadow: 0 30px 60px rgba(168, 85, 247, 0.2); }
.stack-layer.application.active h3 { color: #c084fc; }

/* Stack offsets for 2.5D effect on desktop */
@media (min-width: 1024px) {
  .stack-diagram {
    height: 600px;
    gap: 0;
  }
  
  .stack-layer {
    position: absolute;
    width: 500px;
  }
  
  .stack-layer.application { top: 0; z-index: 3; }
  .stack-layer.logical { top: 120px; z-index: 2; }
  .stack-layer.physical { top: 240px; z-index: 1; }
  
  .stack-layer:not(.active) {
    transform: rotateX(60deg) rotateZ(-10deg) translateZ(0);
  }
}
`;

function injectStackStyles() {
  if (document.getElementById('stack-diagram-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'stack-diagram-styles';
  styleEl.textContent = StackStyles;
  document.head.appendChild(styleEl);
}

function initStackDiagram() {
  console.log('Initializing Stack Diagram...');
  injectStackStyles();

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP or ScrollTrigger not loaded for Stack Diagram');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const container = document.getElementById('stack-diagram-container');
  const diagram = container?.querySelector('.stack-diagram');
  const layers = Array.from(document.querySelectorAll('.stack-layer'));
  
  console.log('Container found:', !!container);
  console.log('Layers found:', layers.length);

  if (!container || !diagram || layers.length === 0) return;

  // Create a master timeline for the stack
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: 'top top',
      end: '+=1500',
      pin: true,
      scrub: true,
      anticipatePin: 1
    }
  });

  layers.forEach((layer, index) => {
    tl.call(() => {
      layers.forEach(l => l.classList.remove('active'));
      layer.classList.add('active');
    }, null, index + 0.1); // Trigger slightly into the step
  });
  
  // Add a final call to remove all or keep last one
  tl.call(() => {}, null, 3);
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.initStackDiagram = initStackDiagram;

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    // Slight delay to ensure GSAP is ready
    setTimeout(initStackDiagram, 100);
  });
}
