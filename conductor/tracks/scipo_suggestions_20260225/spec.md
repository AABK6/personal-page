# Specification: Implement Sci-Po creative suggestions

## Overview
This track implements the creative and interactive suggestions outlined in `scpo/creative_suggestions.md` to transform the "Geopolitics of Artificial Intelligence" material into an immersive, interactive experience.

## Functional Requirements
1. **Decryption Text Effects:** Implement a scrambled hash text effect that decrypts rapidly into readable English on scroll, specifically targeting the main title, "The Clipper Chip Wars" section, and sections on companies implementing cryptography.
2. **Tufte-Style Sidenotes:** Display citations, footnotes, and context directly alongside paragraphs on desktop, and expandable inline on mobile.
3. **Inline Concept Glossary:** Implement dotted-underline for key terms that triggers a glassmorphism tooltip with a quick definition on hover/tap.
4. **Perspective Switcher Toggle:** Provide a toggle switch (e.g., NetMundial summit) to change background tint and highlight different quotes/arguments based on selected worldview.
5. **Print-Optimized "Takeaway" Generator:** Allow users to select highlights and generate a minimalist PDF summary.
6. **Interactive "Stack" Diagram:** Replace static cards with a 3D/2.5D layer diagram that highlights and populates based on scroll progress.
7. **WebGL Background Globe:** Replace static hero background with a dark, interactive 3D globe (Three.js/Globe.gl) that updates based on narrative progress.
8. **Non-Rivalrous Good Visualizer:** Provide an interactive animation comparing a rival good (apple) and a non-rival good (code string) upon user clicks.

## Non-Functional Requirements
- Ensure responsive design, adhering to a balanced approach between visual fidelity and accessibility/performance.
- Integration must work within the existing HTML/CSS/Vanilla JS and GSAP ecosystem.
- Implement automated visual testing (e.g., using Playwright screenshots) to ensure UI changes do not cause visual regressions across the different interactive sections based on `scpo/creative_suggestions.md`.