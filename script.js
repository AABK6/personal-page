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
  let width = 0;
  let height = 0;

  const layersConfig = [
    {
      count: 69,
      nodeSize: 1.8,
      connectDist: 110,
      speed: 0.42,
      parallax: 16,
      influence: 70,
      nodeColor: 'rgba(58, 72, 108, 0.55)',
      linkColor: 'rgba(58, 72, 108, 0.65)',
      linkAlpha: 0.35,
      trailColor: 'rgba(110, 136, 255, 0.25)',
      noise: 0.8,
    },
    {
      count: 87,
      nodeSize: 2.4,
      connectDist: 150,
      speed: 0.65,
      parallax: 26,
      influence: 95,
      nodeColor: 'rgba(96, 116, 176, 0.7)',
      linkColor: 'rgba(96, 116, 176, 0.75)',
      linkAlpha: 0.45,
      trailColor: 'rgba(150, 172, 255, 0.35)',
      noise: 1,
    },
    {
      count: 54,
      nodeSize: 3.1,
      connectDist: 190,
      speed: 0.9,
      parallax: 34,
      influence: 120,
      nodeColor: 'rgba(175, 188, 255, 0.8)',
      linkColor: 'rgba(175, 188, 255, 0.9)',
      linkAlpha: 0.6,
      trailColor: 'rgba(210, 222, 255, 0.45)',
      noise: 1.2,
    },
  ];

  const layers = [];
  const trails = [];
  const TRAIL_THRESHOLD = 1.1;
  const TRAIL_LIMIT = 320;
  const BOUNDS_PADDING = 40;
  let frame = 0;

  const mouse = {
    x: 0,
    y: 0,
    active: false,
  };

  function resize() {
    const prevWidth = width || window.innerWidth;
    const prevHeight = height || window.innerHeight;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    layers.forEach((layer) => {
      layer.points.forEach((point) => {
        point.x = (point.x / prevWidth) * width;
        point.y = (point.y / prevHeight) * height;
      });
    });

    if (!mouse.active) {
      mouse.x = width / 2;
      mouse.y = height / 2;
    }
  }
  window.addEventListener('resize', resize);
  resize();

  function initLayers() {
    layers.length = 0;
    layersConfig.forEach((config, index) => {
      const layer = {
        ...config,
        points: [],
        offset: { x: 0, y: 0 },
        targetOffset: { x: 0, y: 0 },
        seed: index * 32.17,
      };

      for (let i = 0; i < config.count; i++) {
        layer.points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          prevX: 0,
          prevY: 0,
          drawX: 0,
          drawY: 0,
        });
      }
      layers.push(layer);
    });
  }

  initLayers();

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.x = width / 2;
    mouse.y = height / 2;
  });

  function spawnTrail(x, y, stepX, stepY, layer) {
    if (trails.length > TRAIL_LIMIT) {
      trails.splice(0, trails.length - TRAIL_LIMIT);
    }
    const magnitude = Math.hypot(stepX, stepY);
    const life = Math.min(44 + magnitude * 18, 88);
    trails.push({
      x,
      y,
      vx: stepX * 0.4,
      vy: stepY * 0.4,
      age: 0,
      life,
      size: layer.nodeSize * (1.2 + Math.min(magnitude * 0.9, 1.6)),
      color: layer.trailColor,
    });
  }

  function updateTrails() {
    for (let i = trails.length - 1; i >= 0; i--) {
      const trail = trails[i];
      trail.age += 1;
      trail.x += trail.vx;
      trail.y += trail.vy;
      trail.vx *= 0.92;
      trail.vy *= 0.92;
      if (trail.age >= trail.life) {
        trails.splice(i, 1);
      }
    }
  }

  function drawTrails() {
    if (!trails.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    trails.forEach((trail) => {
      const alpha = 1 - trail.age / trail.life;
      if (alpha <= 0) return;
      ctx.globalAlpha = alpha * 0.65;
      ctx.fillStyle = trail.color;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, trail.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function updateLayerOffsets() {
    const normX = width ? mouse.x / width : 0.5;
    const normY = height ? mouse.y / height : 0.5;
    const centerX = mouse.active ? normX - 0.5 : 0;
    const centerY = mouse.active ? normY - 0.5 : 0;

    layers.forEach((layer) => {
      const drift = Math.sin(frame * 0.002 + layer.seed) * 0.6;
      layer.targetOffset.x = (centerX * layer.parallax) + drift;
      layer.targetOffset.y = (centerY * layer.parallax) + Math.cos(frame * 0.002 + layer.seed) * 0.6;
      layer.offset.x += (layer.targetOffset.x - layer.offset.x) * 0.08;
      layer.offset.y += (layer.targetOffset.y - layer.offset.y) * 0.08;
    });
  }

  function updatePoints() {
    layers.forEach((layer) => {
      const maxSpeed = 1.8 * layer.speed;
      const noiseFactor = 0.008 * layer.noise;
      layer.points.forEach((point) => {
        point.prevX = point.x;
        point.prevY = point.y;

        point.vx += (Math.random() - 0.5) * noiseFactor;
        point.vy += (Math.random() - 0.5) * noiseFactor;

        point.x += point.vx * layer.speed;
        point.y += point.vy * layer.speed;

        if (point.x < -BOUNDS_PADDING) point.x = width + BOUNDS_PADDING;
        if (point.x > width + BOUNDS_PADDING) point.x = -BOUNDS_PADDING;
        if (point.y < -BOUNDS_PADDING) point.y = height + BOUNDS_PADDING;
        if (point.y > height + BOUNDS_PADDING) point.y = -BOUNDS_PADDING;

        point.vx *= 0.99;
        point.vy *= 0.99;

        const velocityMag = Math.hypot(point.vx, point.vy);
        if (velocityMag > maxSpeed) {
          const scale = maxSpeed / velocityMag;
          point.vx *= scale;
          point.vy *= scale;
        }

        point.drawX = point.x + layer.offset.x;
        point.drawY = point.y + layer.offset.y;

        if (mouse.active) {
          const dx = point.drawX - mouse.x;
          const dy = point.drawY - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < layer.influence) {
            const force = (layer.influence - dist) / layer.influence;
            point.vx += (dx / dist) * force * 0.6;
            point.vy += (dy / dist) * force * 0.6;
          }
        }

        const stepX = point.x - point.prevX;
        const stepY = point.y - point.prevY;
        const stepSpeed = Math.hypot(stepX, stepY);
        if (stepSpeed > TRAIL_THRESHOLD) {
          spawnTrail(point.drawX, point.drawY, stepX, stepY, layer);
        }
      });
    });
  }

  function drawConnections() {
    layers.forEach((layer) => {
      const points = layer.points;
      ctx.strokeStyle = layer.linkColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const dx = a.drawX - b.drawX;
          const dy = a.drawY - b.drawY;
          const dist = Math.hypot(dx, dy);
          if (dist < layer.connectDist) {
            const alpha = layer.linkAlpha * (1 - dist / layer.connectDist);
            if (alpha <= 0.02) continue;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(a.drawX, a.drawY);
            ctx.lineTo(b.drawX, b.drawY);
            ctx.stroke();
          }
        }
      }
    });
    ctx.globalAlpha = 1;
  }

  function drawNodes() {
    layers.forEach((layer) => {
      ctx.fillStyle = layer.nodeColor;
      layer.points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.drawX, point.drawY, layer.nodeSize, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    frame += 1;

    updateLayerOffsets();
    updatePoints();
    updateTrails();
    drawTrails();
    drawConnections();
    drawNodes();

    requestAnimationFrame(animate);
  }

  animate();
})();
