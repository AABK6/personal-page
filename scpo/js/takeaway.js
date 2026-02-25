/**
 * Print-Optimized Takeaway Generator implementation.
 * Allows users to select specific quotes, insights, or sections
 * and generate a beautifully formatted, minimalist PDF summary.
 */

const TakeawayStyles = `
/* Save Button appended to blocks */
.takeaway-save-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  color: var(--color-text-muted, #94a3b8);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.takeaway-save-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.takeaway-save-btn.saved {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: #34d399; /* emerald-400 */
}

/* Floating Action Button (FAB) */
.takeaway-fab {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%) translateY(150%);
  background: #fff;
  color: #0f172a;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  z-index: 9999;
  border: none;
  opacity: 0;
  visibility: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.takeaway-fab.visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.takeaway-fab:hover {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.takeaway-fab-badge {
  background: #0f172a;
  color: #fff;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
}

/* Hidden Print Container */
#takeaway-print-container {
  display: none;
}

/* Print Styles */
@media print {
  /* Hide the entire standard website */
  body > *:not(#takeaway-print-container) {
    display: none !important;
  }
  
  /* Reset body and html for clean print */
  html, body {
    background: #fff !important;
    color: #000 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* Show print container */
  #takeaway-print-container {
    display: block !important;
    padding: 2rem !important;
    max-width: 800px !important;
    margin: 0 auto !important;
    font-family: Georgia, serif !important;
  }

  /* Specific styling for the generated PDF */
  #takeaway-print-container h1 {
    font-size: 24px !important;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;
    margin-bottom: 30px;
  }

  #takeaway-print-container .takeaway-item {
    margin-bottom: 30px !important;
    padding-bottom: 20px !important;
    border-bottom: 1px solid #ccc !important;
  }
  
  #takeaway-print-container .takeaway-item:last-child {
    border-bottom: none !important;
  }

  /* Strip background colors and complex styles from cloned blocks */
  #takeaway-print-container .insight-card,
  #takeaway-print-container .quote-block,
  #takeaway-print-container .takeaway-source {
    background: none !important;
    border: none !important;
    color: #000 !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  #takeaway-print-container * {
    color: #000 !important;
  }

  /* Hide the save buttons inside the print version */
  #takeaway-print-container .takeaway-save-btn {
    display: none !important;
  }
}
`;

function injectTakeawayStyles() {
  if (document.getElementById('takeaway-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'takeaway-styles';
  styleEl.textContent = TakeawayStyles;
  document.head.appendChild(styleEl);
}

function initTakeawayGenerator() {
  injectTakeawayStyles();

  // Create print container
  let printContainer = document.getElementById('takeaway-print-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'takeaway-print-container';
    
    // Add header to print container
    const printHeader = document.createElement('h1');
    printHeader.textContent = 'Key Takeaways: AI Geopolitics';
    printContainer.appendChild(printHeader);
    
    document.body.appendChild(printContainer);
  }

  // Create FAB
  let fab = document.querySelector('.takeaway-fab');
  if (!fab) {
    fab = document.createElement('button');
    fab.className = 'takeaway-fab';
    fab.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      <span class="fab-text">Print Takeaways</span>
      <span class="takeaway-fab-badge">0</span>
    `;
    document.body.appendChild(fab);

    fab.addEventListener('click', () => {
      window.print();
    });
  }

  const selectedItems = new Set();
  const badge = fab.querySelector('.takeaway-fab-badge');
  const fabText = fab.querySelector('.fab-text');

  const updateFab = () => {
    const count = selectedItems.size;
    badge.textContent = count;
    
    if (count > 0) {
      fab.classList.add('visible');
      fabText.textContent = count === 1 ? 'Print 1 Takeaway' : `Print ${count} Takeaways`;
    } else {
      fab.classList.remove('visible');
    }
  };

  const updatePrintContainer = () => {
    // Clear everything except header
    Array.from(printContainer.children).forEach(child => {
      if (child.tagName !== 'H1') {
        child.remove();
      }
    });

    selectedItems.forEach(el => {
      const clone = el.cloneNode(true);
      clone.classList.add('takeaway-item');
      printContainer.appendChild(clone);
    });
  };

  const sources = document.querySelectorAll('.takeaway-source');
  
  sources.forEach((source, index) => {
    // Prevent double initialization
    if (source.hasAttribute('data-takeaway-initialized')) return;
    source.setAttribute('data-takeaway-initialized', 'true');
    
    // Assign a unique ID if it doesn't have one
    if (!source.id) {
      source.id = 'takeaway-item-' + index;
    }

    const btn = document.createElement('button');
    btn.className = 'takeaway-save-btn';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
      <span>Save to Takeaways</span>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isSaved = selectedItems.has(source);
      
      if (isSaved) {
        selectedItems.delete(source);
        btn.classList.remove('saved');
        btn.querySelector('span').textContent = 'Save to Takeaways';
      } else {
        selectedItems.add(source);
        btn.classList.add('saved');
        btn.querySelector('span').textContent = 'Saved';
      }
      
      updateFab();
      updatePrintContainer();
    });

    // Append button
    source.appendChild(btn);
  });
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.initTakeawayGenerator = initTakeawayGenerator;

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initTakeawayGenerator();
  });
}
