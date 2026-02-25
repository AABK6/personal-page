# Implementation Plan: Implement Sci-Po creative suggestions

## Phase 1: Setup and Foundation [checkpoint: 854adfa]
- [x] Task: Project setup for testing
  - [x] Review `scpo/creative_suggestions.md` to establish visual and interaction baselines. 24e5215
  - [x] Write tests configuration for UI interactions and automated visual testing (set up Playwright for screenshot comparisons). 687d886
  - [x] Implement initial scaffolding for new script modules 1661c4d
- [x] Task: Conductor - User Manual Verification 'Phase 1: Setup and Foundation' (Protocol in workflow.md) 854adfa

## Phase 2: Decryption Text Effects [checkpoint: e80e8c7]
- [x] Task: Implement decryption effect logic
  - [x] Write failing unit tests for text decryption utility function 64730be
  - [x] Implement text decryption logic 64730be
  - [x] Integrate decryption effect with scroll triggers for main title and Clipper Chip sections ecddfd1
- [x] Task: Conductor - User Manual Verification 'Phase 2: Decryption Text Effects' (Protocol in workflow.md) e80e8c7

## Phase 3: Advanced Pedagogical UX [checkpoint: b1a16a0]
- [x] Task: Tufte-Style Sidenotes (CANCELLED)
  - [x] Scrapped based on user feedback.
- [x] Task: Inline Concept Glossary
  - [x] Write tests for tooltip rendering and positioning d2499f4
  - [x] Implement glassmorphism tooltip functionality d2499f4
- [x] Task: Perspective Switcher Toggle
  - [x] Write tests for state management of perspective switcher 66a6938
  - [x] Implement UI toggle and dynamic highlighting 66a6938
- [x] Task: Print-Optimized Takeaway Generator (CANCELLED)
  - [x] Scrapped based on user feedback.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Advanced Pedagogical UX' (Protocol in workflow.md) b1a16a0

## Phase 4: Visualizations and Scrollytelling
- [~] Task: Interactive Stack Diagram
  - [~] Write tests for diagram layer state updates
  - [ ] Implement 3D/2.5D interactive stack diagram
- [ ] Task: Non-Rivalrous Good Visualizer
  - [ ] Write tests for visualizer interaction logic
  - [ ] Implement interactive animation for rival vs non-rival goods
- [ ] Task: WebGL Background Globe
  - [ ] Write tests for globe initialization parameters
  - [ ] Implement Three.js/Globe.gl background
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Visualizations and Scrollytelling' (Protocol in workflow.md)