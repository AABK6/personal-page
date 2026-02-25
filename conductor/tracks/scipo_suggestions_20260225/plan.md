# Implementation Plan: Implement Sci-Po creative suggestions

## Phase 1: Setup and Foundation [checkpoint: 854adfa]
- [x] Task: Project setup for testing
  - [x] Review `scpo/creative_suggestions.md` to establish visual and interaction baselines. 24e5215
  - [x] Write tests configuration for UI interactions and automated visual testing (set up Playwright for screenshot comparisons). 687d886
  - [x] Implement initial scaffolding for new script modules 1661c4d
- [x] Task: Conductor - User Manual Verification 'Phase 1: Setup and Foundation' (Protocol in workflow.md) 854adfa

## Phase 2: Decryption Text Effects
- [x] Task: Implement decryption effect logic
  - [x] Write failing unit tests for text decryption utility function 64730be
  - [x] Implement text decryption logic 64730be
  - [x] Integrate decryption effect with scroll triggers for main title and Clipper Chip sections ecddfd1
- [~] Task: Conductor - User Manual Verification 'Phase 2: Decryption Text Effects' (Protocol in workflow.md)

## Phase 3: Advanced Pedagogical UX
- [ ] Task: Tufte-Style Sidenotes
  - [ ] Write tests for layout responsiveness of sidenotes
  - [ ] Implement CSS and JS for inline sidenotes
- [ ] Task: Inline Concept Glossary
  - [ ] Write tests for tooltip rendering and positioning
  - [ ] Implement glassmorphism tooltip functionality
- [ ] Task: Perspective Switcher Toggle
  - [ ] Write tests for state management of perspective switcher
  - [ ] Implement UI toggle and dynamic highlighting
- [ ] Task: Print-Optimized Takeaway Generator
  - [ ] Write tests for text selection and PDF generation module
  - [ ] Implement PDF generator logic
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Advanced Pedagogical UX' (Protocol in workflow.md)

## Phase 4: Visualizations and Scrollytelling
- [ ] Task: Interactive Stack Diagram
  - [ ] Write tests for diagram layer state updates
  - [ ] Implement 3D/2.5D interactive stack diagram
- [ ] Task: Non-Rivalrous Good Visualizer
  - [ ] Write tests for visualizer interaction logic
  - [ ] Implement interactive animation for rival vs non-rival goods
- [ ] Task: WebGL Background Globe
  - [ ] Write tests for globe initialization parameters
  - [ ] Implement Three.js/Globe.gl background
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Visualizations and Scrollytelling' (Protocol in workflow.md)