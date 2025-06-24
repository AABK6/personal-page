window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('fade-out');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 600);
  }
});

(() => {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  const POINTS = 75;
  const CONNECT_DIST = 120;
  const INFLUENCE = 100;
  const points = [];
  const mouse = { x: null, y: null };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Point {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.6;
      this.vy = (Math.random() - 0.5) * 0.6;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      if (mouse.x !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < INFLUENCE && dist > 0) {
          const force = (INFLUENCE - dist) / INFLUENCE;
          this.vx += (dx / dist) * force * 0.5;
          this.vy += (dy / dist) * force * 0.5;
        }
      }

      this.vx *= 0.98;
      this.vy *= 0.98;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < POINTS; i++) {
    points.push(new Point());
  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseout', () => {
    mouse.x = mouse.y = null;
  });

  function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#1d1d1f';
    points.forEach((p) => p.update());

    ctx.strokeStyle = '#1d1d1f';
    for (let i = 0; i < POINTS; i++) {
      for (let j = i + 1; j < POINTS; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          ctx.globalAlpha = 1 - dist / CONNECT_DIST;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    points.forEach((p) => p.draw());

    requestAnimationFrame(animate);
  }

  animate();
})();
