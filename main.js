import { initThree } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  new Rellax('.parallax-layer');
  document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('parallax').style.display = 'none';
    const container = document.getElementById('three-container');
    container.style.display = 'block';
    initThree();
  });
});
