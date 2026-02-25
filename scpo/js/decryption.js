/**
 * Decryption text effect
 * Rapidly cycles through random characters before settling on the final string.
 */

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';

function initDecryption(element) {
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
    }
  }, interval);
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.initDecryption = initDecryption;
}
