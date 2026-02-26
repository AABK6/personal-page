/**
 * Decryption text effect
 * Rapidly cycles through random characters before settling on the final string.
 */

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';

function initDecryption(element) {
  // Prevent running multiple times
  if (element.hasAttribute('data-decrypting')) return;
  element.setAttribute('data-decrypting', 'true');

  const finalString = element.getAttribute('data-decrypt') || element.textContent;
  let iterations = 0;
  const maxIterations = 20; // Number of times to cycle before stopping
  const interval = 30; // ms between updates

  const intervalId = setInterval(() => {
    let currentString = '';
    
    // As iterations progress, reveal more of the final string
    const revealCount = Math.floor((iterations / maxIterations) * finalString.length);

    for (let i = 0; i < finalString.length; i++) {
      if (i < revealCount) {
        // Character is revealed
        currentString += finalString[i];
      } else if (finalString[i] === ' ') {
        // Keep spaces as spaces
        currentString += ' ';
      } else {
        // Random character
        currentString += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      }
    }

    element.textContent = currentString;
    iterations++;

    if (iterations > maxIterations) {
      clearInterval(intervalId);
      element.textContent = finalString;
      element.removeAttribute('data-decrypting');
      element.setAttribute('data-decrypted', 'true');
    }
  }, interval);
}

function wrapTextNodes(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim().length > 0 && node.parentNode.tagName !== 'SCRIPT' && node.parentNode.tagName !== 'STYLE') {
      textNodes.push(node);
    }
  }

  const targets = [];
  textNodes.forEach(textNode => {
    const span = document.createElement('span');
    span.setAttribute('data-decrypt', textNode.nodeValue);
    
    // Scramble initially
    let scrambled = '';
    for (let i = 0; i < textNode.nodeValue.length; i++) {
      scrambled += textNode.nodeValue[i] === ' ' ? ' ' : CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    }
    span.textContent = scrambled;
    
    textNode.parentNode.replaceChild(span, textNode);
    targets.push(span);
  });
  return targets;
}

function setupDecryptScrollTriggers() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const elements = document.querySelectorAll('.decrypt-on-scroll');
  
  elements.forEach((el) => {
    // If it has HTML children (not just text), we wrap its text nodes
    let targets = [el];
    if (el.children.length > 0 || el.classList.contains('decrypt-container')) {
      targets = wrapTextNodes(el);
    } else {
      // Single element without HTML children
      if (!el.hasAttribute('data-decrypt')) {
        el.setAttribute('data-decrypt', el.textContent);
      }
      if (!el.hasAttribute('data-decrypted') && !el.hasAttribute('data-decrypting')) {
        const finalStr = el.getAttribute('data-decrypt');
        let scrambled = '';
        for (let i = 0; i < finalStr.length; i++) {
          scrambled += finalStr[i] === ' ' ? ' ' : CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        }
        el.textContent = scrambled;
      }
    }

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        targets.forEach(t => initDecryption(t));
      }
    });
  });
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.initDecryption = initDecryption;
  window.setupDecryptScrollTriggers = setupDecryptScrollTriggers;

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    // Slight delay to ensure GSAP is ready if loaded asynchronously
    setTimeout(setupDecryptScrollTriggers, 100);
  });
}
