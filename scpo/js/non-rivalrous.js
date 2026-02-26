/**
 * Non-Rivalrous Good Visualizer implementation.
 * Contrasts rival goods (consumed upon use) with non-rival goods (infinitely duplicatable).
 */

const NonRivalrousStyles = `
.code-container {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 0.5rem;
  padding: 1rem;
  overflow-y: auto;
}

.code-container code {
  background: rgba(34, 211, 238, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.apple-container {
  transition: all 0.5s ease;
}

.apple-container.consumed {
  transform: scale(0.5);
  opacity: 0.5;
  filter: grayscale(1);
}
`;

function injectNonRivalrousStyles() {
  if (document.getElementById('non-rivalrous-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'non-rivalrous-styles';
  styleEl.textContent = NonRivalrousStyles;
  document.head.appendChild(styleEl);
}

function initNonRivalrousVisualizer() {
  const container = document.getElementById('non-rivalrous-container');
  if (!container || container.hasAttribute('data-initialized')) return;
  container.setAttribute('data-initialized', 'true');

  injectNonRivalrousStyles();

  const rivalGood = document.getElementById('rival-good');
  const apple = document.querySelector('.apple-container');
  
  const nonRivalGood = document.getElementById('non-rival-good');
  const codeContainer = document.querySelector('.code-container');

  if (rivalGood && apple) {
    rivalGood.addEventListener('click', () => {
      apple.textContent = '💨';
      apple.classList.add('consumed');
      rivalGood.querySelector('p').textContent = 'Consumed! (Rival good)';
    });
  }

  if (nonRivalGood && codeContainer) {
    nonRivalGood.addEventListener('click', () => {
      // Exponential duplication
      const currentCodes = codeContainer.querySelectorAll('code');
      const count = currentCodes.length;
      
      // Limit to prevent crashing browser
      if (count >= 64) {
        nonRivalGood.querySelector('p').textContent = 'Shared infinitely! (Non-rival good)';
        return;
      }

      for (let i = 0; i < count; i++) {
        const clone = currentCodes[i].cloneNode(true);
        codeContainer.appendChild(clone);
      }
      
      nonRivalGood.querySelector('p').textContent = `Shared ${codeContainer.querySelectorAll('code').length} times!`;
    });
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.initNonRivalrousVisualizer = initNonRivalrousVisualizer;

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initNonRivalrousVisualizer();
  });
}
