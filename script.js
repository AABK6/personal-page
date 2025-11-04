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
  let frame = 0;

  const layersConfig = [
    {
      count: 48,
      nodeSize: 1.7,
      connectDist: 120,
      speed: 0.42,
      parallax: 16,
      influence: 74,
      nodeColor: 'rgba(58, 72, 108, 0.55)',
      linkColor: 'rgba(58, 72, 108, 0.65)',
      linkAlpha: 0.35,
      trailColor: 'rgba(110, 136, 255, 0.25)',
      noise: 0.8,
    },
    {
      count: 62,
      nodeSize: 2.5,
      connectDist: 160,
      speed: 0.66,
      parallax: 26,
      influence: 100,
      nodeColor: 'rgba(96, 116, 176, 0.7)',
      linkColor: 'rgba(96, 116, 176, 0.76)',
      linkAlpha: 0.46,
      trailColor: 'rgba(150, 172, 255, 0.35)',
      noise: 1,
    },
    {
      count: 40,
      nodeSize: 3.2,
      connectDist: 210,
      speed: 0.92,
      parallax: 34,
      influence: 132,
      nodeColor: 'rgba(175, 188, 255, 0.82)',
      linkColor: 'rgba(175, 188, 255, 0.92)',
      linkAlpha: 0.62,
      trailColor: 'rgba(210, 222, 255, 0.48)',
      noise: 1.2,
    },
  ];

  const layers = [];
  const trails = [];
  let totalPoints = 0;

  const environment = {
    energy: 0,
    targetEnergy: 0,
    focus: 0,
  };

  const mouse = {
    x: 0,
    y: 0,
    active: false,
  };

  const lens = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    radius: 190,
    innerRadius: 70,
    strength: 0.85,
    swirl: 0.07,
    smoothing: 0.12,
    visible: 0,
  };

  const fog = {
    canvas: document.createElement('canvas'),
    ctx: null,
    pattern: null,
    scale: 1.6,
    offsetX: 0,
    offsetY: 0,
    driftX: 0.27,
    driftY: 0.18,
  };
  fog.ctx = fog.canvas.getContext('2d');

  const bloom = {
    active: false,
    frame: 0,
    formFrames: 160,
    holdFrames: 130,
    releaseFrames: 180,
    nodes: [],
    targets: [],
    edges: [],
    indexMap: new Map(),
    influence: 0,
    edgeIntensity: 0,
  };
  let lastBloomFrame = 0;

  const bloomShapes = [
    {
      count: 14,
      build(anchor, radius) {
        const outer = 8;
        const inner = 6;
        const targets = [];
        const edges = [];
        for (let i = 0; i < outer; i++) {
          const angle = (i / outer) * Math.PI * 2;
          const jitter = 0.82 + Math.random() * 0.22;
          targets.push({
            x: anchor.x + Math.cos(angle) * radius * jitter,
            y: anchor.y + Math.sin(angle) * radius * jitter * 0.95,
          });
          edges.push([i, (i + 1) % outer]);
        }
        for (let i = 0; i < inner; i++) {
          const angle = (i / inner) * Math.PI * 2 + Math.PI / inner;
          targets.push({
            x: anchor.x + Math.cos(angle) * radius * 0.52,
            y: anchor.y + Math.sin(angle) * radius * 0.52,
          });
          const outerIndex = Math.round((i / inner) * outer) % outer;
          edges.push([outerIndex, outer + i]);
        }
        return { targets, edges };
      },
    },
    {
      count: 18,
      build(anchor, radius) {
        const total = 18;
        const targets = [];
        const edges = [];
        for (let i = 0; i < total; i++) {
          const ratio = i / total;
          const angle = ratio * Math.PI * (3 - Math.sqrt(5)) * 2;
          const r = radius * Math.sqrt(ratio);
          targets.push({
            x: anchor.x + Math.cos(angle) * r,
            y: anchor.y + Math.sin(angle) * r * 0.9,
          });
          if (i > 0) edges.push([i - 1, i]);
          if (i > 2) edges.push([i, Math.floor(i * 0.55)]);
        }
        return { targets, edges };
      },
    },
    {
      count: 16,
      build(anchor, radius) {
        const cols = 4;
        const rows = 4;
        const targets = [];
        const edges = [];
        const w = radius * 0.9;
        const h = radius * 0.9;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const offsetX = ((c / (cols - 1)) - 0.5) * w * 2;
            const offsetY = ((r / (rows - 1)) - 0.5) * h * 1.8;
            targets.push({
              x: anchor.x + offsetX + (Math.random() - 0.5) * radius * 0.08,
              y: anchor.y + offsetY + (Math.random() - 0.5) * radius * 0.08,
            });
            if (c > 0) edges.push([idx - 1, idx]);
            if (r > 0) edges.push([idx - cols, idx]);
          }
        }
        return { targets, edges };
      },
    },
  ];
  const TRAIL_THRESHOLD = 1.1;
  const TRAIL_LIMIT = 420;
  const BOUNDS_PADDING = 40;

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

    generateFogTexture();

    if (!mouse.active) {
      mouse.x = width / 2;
      mouse.y = height / 2;
    }

    lens.x = width / 2;
    lens.y = height / 2;
    lens.targetX = lens.x;
    lens.targetY = lens.y;
  }
  window.addEventListener('resize', resize);

  function initLayers() {
    totalPoints = 0;
    layers.length = 0;
    layersConfig.forEach((config, index) => {
      const layer = {
        ...config,
        points: [],
        offset: { x: 0, y: 0 },
        targetOffset: { x: 0, y: 0 },
        seed: index * 31.71,
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
          lensIntensity: 0,
          bloomIntensity: 0,
        });
      }
      totalPoints += layer.points.length;
      layers.push(layer);
    });
  }

  resize();
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

  function generateFogTexture() {
    const fogWidth = Math.max(1, Math.round(width * fog.scale));
    const fogHeight = Math.max(1, Math.round(height * fog.scale));
    fog.canvas.width = fogWidth;
    fog.canvas.height = fogHeight;
    const fctx = fog.ctx;
    fctx.clearRect(0, 0, fogWidth, fogHeight);
    fctx.globalCompositeOperation = 'lighter';

    const blobCount = Math.round((fogWidth * fogHeight) / 9000);
    for (let i = 0; i < blobCount; i++) {
      const radius = 120 + Math.random() * 280;
      const x = Math.random() * fogWidth;
      const y = Math.random() * fogHeight;
      const gradient = fctx.createRadialGradient(x, y, 0, x, y, radius);
      const core = 0.08 + Math.random() * 0.08;
      gradient.addColorStop(0, `rgba(255, 255, 255, ${core})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      fctx.fillStyle = gradient;
      fctx.beginPath();
      fctx.arc(x, y, radius, 0, Math.PI * 2);
      fctx.fill();
    }

    for (let i = 0; i < blobCount / 2; i++) {
      const radius = 90 + Math.random() * 200;
      const x = Math.random() * fogWidth;
      const y = Math.random() * fogHeight;
      const tint = 0.03 + Math.random() * 0.05;
      const gradient = fctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(160, 180, 255, ${tint})`);
      gradient.addColorStop(1, 'rgba(160, 180, 255, 0)');
      fctx.fillStyle = gradient;
      fctx.beginPath();
      fctx.arc(x, y, radius, 0, Math.PI * 2);
      fctx.fill();
    }

    fctx.globalCompositeOperation = 'source-over';
    fog.pattern = ctx.createPattern(fog.canvas, 'repeat');
  }
  function spawnTrail(x, y, stepX, stepY, layer) {
    if (trails.length > TRAIL_LIMIT) {
      trails.splice(0, trails.length - TRAIL_LIMIT);
    }
    const magnitude = Math.hypot(stepX, stepY);
    const life = Math.min(52 + magnitude * 22, 96);
    trails.push({
      x,
      y,
      vx: stepX * 0.42,
      vy: stepY * 0.42,
      age: 0,
      life,
      size: layer.nodeSize * (1.3 + Math.min(magnitude * 1.1, 2.1)),
      baseColor: layer.trailColor,
      chroma: Math.min(1, magnitude * 0.9),
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
      const size = trail.size * alpha;
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = trail.baseColor;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, size, 0, Math.PI * 2);
      ctx.fill();

      if (trail.chroma > 0.05) {
        const shift = 4.5 * trail.chroma;
        const chromaAlpha = alpha * 0.65 * trail.chroma;

        ctx.globalAlpha = chromaAlpha;
        ctx.fillStyle = 'rgba(255, 80, 180, 0.7)';
        ctx.beginPath();
        ctx.arc(trail.x - shift, trail.y, size * 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(90, 190, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(trail.x + shift, trail.y, size * 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(170, 255, 150, 0.6)';
        ctx.beginPath();
        ctx.arc(trail.x, trail.y + shift * 0.6, size * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  function drawBackgroundGradient() {
    const energy = environment.energy;
    const focus = environment.focus;
    const shiftX = width ? (mouse.x / width - 0.5) * (0.12 + energy * 0.08) : 0;
    const shiftY = height ? (mouse.y / height - 0.5) * (0.12 + energy * 0.08) : 0;

    const innerColor = mixColor([247, 248, 255], [228, 235, 255], energy);
    const midColor = mixColor([224, 228, 244], [170, 185, 252], energy);
    const outerColor = mixColor([212, 216, 236], [134, 138, 210], energy);
    const highlight = mixColor([255, 255, 255], [210, 220, 255], focus);

    const gradient = ctx.createRadialGradient(
      width * (0.5 + shiftX),
      height * (0.48 + shiftY),
      Math.max(width, height) * (0.05 + energy * 0.08),
      width / 2,
      height / 2,
      Math.max(width, height) * (0.78 + energy * 0.25 + focus * 0.15)
    );
    gradient.addColorStop(0, `rgba(${innerColor.join(',')}, 1)`);
    gradient.addColorStop(0.35, `rgba(${highlight.join(',')}, ${0.7 + focus * 0.2})`);
    gradient.addColorStop(0.72, `rgba(${midColor.join(',')}, 1)`);
    gradient.addColorStop(1, `rgba(${outerColor.join(',')}, 1)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const overlay = ctx.createLinearGradient(0, 0, 0, height);
    overlay.addColorStop(0, `rgba(255, 255, 255, ${0.08 + energy * 0.05})`);
    overlay.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    overlay.addColorStop(1, `rgba(210, 216, 240, ${0.12 + energy * 0.08})`);
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);
  }
  function drawFog() {
    if (!fog.pattern) return;
    const patternWidth = fog.canvas.width || width;
    const patternHeight = fog.canvas.height || height;
    fog.offsetX = (fog.offsetX + fog.driftX) % patternWidth;
    fog.offsetY = (fog.offsetY + fog.driftY) % patternHeight;

    const alpha = 0.2 + environment.energy * 0.18;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fog.pattern;
    ctx.translate(-fog.offsetX, -fog.offsetY);
    ctx.fillRect(-patternWidth, -patternHeight, width + patternWidth * 2, height + patternHeight * 2);
    ctx.restore();
  }

  function updateLayerOffsets() {
    const normX = width ? mouse.x / width : 0.5;
    const normY = height ? mouse.y / height : 0.5;
    const baseX = mouse.active ? normX - 0.5 : 0;
    const baseY = mouse.active ? normY - 0.5 : 0;

    layers.forEach((layer, index) => {
      const drift = Math.sin(frame * 0.002 + layer.seed) * 0.6;
      const lensInfluence = ((lens.x / (width || 1)) - 0.5) * lens.visible * (index + 1) * 0.6;
      layer.targetOffset.x = (baseX * layer.parallax) + drift + lensInfluence * 10;
      layer.targetOffset.y = (baseY * layer.parallax) + Math.cos(frame * 0.002 + layer.seed) * 0.6;
      layer.offset.x += (layer.targetOffset.x - layer.offset.x) * 0.08;
      layer.offset.y += (layer.targetOffset.y - layer.offset.y) * 0.08;
    });
  }

  function updateLens() {
    lens.targetX = mouse.active ? mouse.x : width / 2;
    lens.targetY = mouse.active ? mouse.y : height / 2;
    lens.x += (lens.targetX - lens.x) * lens.smoothing;
    lens.y += (lens.targetY - lens.y) * lens.smoothing;
    const targetVisible = mouse.active ? 1 : 0;
    lens.visible += (targetVisible - lens.visible) * 0.1;
  }

  function applyBloomEffect(point) {
    if (!bloom.active || bloom.influence <= 0) {
      point.bloomIntensity = 0;
      return 0;
    }
    const bloomIndex = bloom.indexMap.get(point);
    if (bloomIndex === undefined) {
      point.bloomIntensity *= 0.85;
      return 0;
    }
    const target = bloom.targets[bloomIndex];
    if (!target) {
      point.bloomIntensity = 0;
      return 0;
    }
    const wobble = Math.sin(frame * 0.04 + bloomIndex) * 6 * bloom.influence;
    const wobbleY = Math.cos(frame * 0.045 + bloomIndex * 0.6) * 4 * bloom.influence;

    const baseX = point.drawX;
    const baseY = point.drawY;
    const targetX = target.x + wobble;
    const targetY = target.y + wobbleY;
    const influence = bloom.influence;

    point.drawX = baseX + (targetX - baseX) * (0.55 + 0.45 * influence);
    point.drawY = baseY + (targetY - baseY) * (0.55 + 0.45 * influence);
    point.bloomIntensity = influence;
    return influence;
  }

  function updatePoints() {
    let speedSum = 0;
    let magnetSum = 0;
    layers.forEach((layer) => {
      const maxSpeed = 1.9 * layer.speed;
      const noiseFactor = 0.008 * layer.noise;
      layer.points.forEach((point) => {
        point.prevX = point.x;
        point.prevY = point.y;
        point.lensIntensity = 0;
        point.bloomIntensity = 0;

        point.vx += (Math.random() - 0.5) * noiseFactor;
        point.vy += (Math.random() - 0.5) * noiseFactor;

        point.x += point.vx * layer.speed;
        point.y += point.vy * layer.speed;

        if (point.x < -BOUNDS_PADDING) point.x = width + BOUNDS_PADDING;
        if (point.x > width + BOUNDS_PADDING) point.x = -BOUNDS_PADDING;
        if (point.y < -BOUNDS_PADDING) point.y = height + BOUNDS_PADDING;
        if (point.y > height + BOUNDS_PADDING) point.y = -BOUNDS_PADDING;

        point.vx *= 0.992;
        point.vy *= 0.992;

        let velocityMag = Math.hypot(point.vx, point.vy);
        if (velocityMag > maxSpeed) {
          const scale = maxSpeed / velocityMag;
          point.vx *= scale;
          point.vy *= scale;
          velocityMag = maxSpeed;
        }
        speedSum += velocityMag;

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

        if (lens.visible > 0.02) {
          const dxLens = point.drawX - lens.x;
          const dyLens = point.drawY - lens.y;
          const distLens = Math.hypot(dxLens, dyLens);
          if (distLens > 0 && distLens < lens.radius) {
            const norm = distLens / lens.radius;
            const pull = (1 - norm) * lens.strength;
            const angle = Math.atan2(dyLens, dxLens) + Math.PI / 2;
            const swirl = lens.swirl * (1 - norm);
            point.vx -= (dxLens / distLens) * pull * 0.55;
            point.vy -= (dyLens / distLens) * pull * 0.55;
            point.vx += Math.cos(angle) * swirl;
            point.vy += Math.sin(angle) * swirl;
            point.lensIntensity = Math.max(point.lensIntensity, 1 - norm);
            magnetSum += point.lensIntensity;
          }
        }

        const stepX = point.x - point.prevX;
        const stepY = point.y - point.prevY;
        const stepSpeed = Math.hypot(stepX, stepY);
        if (stepSpeed > TRAIL_THRESHOLD) {
          spawnTrail(point.drawX, point.drawY, stepX, stepY, layer);
        }

        applyBloomEffect(point);
      });
    });

    return {
      avgSpeed: totalPoints ? speedSum / totalPoints : 0,
      magnetFocus: totalPoints ? magnetSum / totalPoints : 0,
    };
  }
  function drawConnections() {
    ctx.save();
    layers.forEach((layer) => {
      const points = layer.points;
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const dx = a.drawX - b.drawX;
          const dy = a.drawY - b.drawY;
          const dist = Math.hypot(dx, dy);
          if (dist < layer.connectDist) {
            const baseAlpha = layer.linkAlpha * (1 - dist / layer.connectDist);
            if (baseAlpha <= 0.02) continue;
            const highlight = Math.max(a.bloomIntensity, b.bloomIntensity);
            const magnet = Math.max(a.lensIntensity, b.lensIntensity);
            ctx.strokeStyle = highlight > 0.25
              ? `rgba(210, 220, 255, ${0.45 + highlight * 0.4})`
              : layer.linkColor;
            ctx.globalAlpha = baseAlpha * (0.8 + highlight * 0.7 + magnet * 0.5);
            ctx.lineWidth = 0.8 + highlight * 1.3 + magnet * 0.6;
            ctx.beginPath();
            ctx.moveTo(a.drawX, a.drawY);
            ctx.lineTo(b.drawX, b.drawY);
            ctx.stroke();
          }
        }
      }
    });
    ctx.restore();
  }

  function drawBloomEdges() {
    if (!bloom.active || bloom.edgeIntensity <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.4 + bloom.edgeIntensity * 1.6;
    ctx.strokeStyle = `rgba(210, 222, 255, ${0.45 + bloom.edgeIntensity * 0.35})`;
    bloom.edges.forEach(([aIndex, bIndex]) => {
      const pointA = bloom.nodes[aIndex];
      const pointB = bloom.nodes[bIndex];
      if (!pointA || !pointB) return;
      ctx.beginPath();
      ctx.moveTo(pointA.drawX, pointA.drawY);
      ctx.lineTo(pointB.drawX, pointB.drawY);
      ctx.stroke();
    });
    ctx.restore();
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

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    layers.forEach((layer) => {
      layer.points.forEach((point) => {
        const flare = Math.max(point.lensIntensity * 0.85, point.bloomIntensity);
        if (flare <= 0.02) return;
        const size = layer.nodeSize * (1.4 + flare);
        ctx.fillStyle = `rgba(210, 220, 255, ${0.28 + flare * 0.35})`;
        ctx.beginPath();
        ctx.arc(point.drawX, point.drawY, size, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.restore();
  }

  function drawLens() {
    if (lens.visible <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = 0.45 * lens.visible;
    const gradient = ctx.createRadialGradient(
      lens.x,
      lens.y,
      lens.innerRadius * 0.4,
      lens.x,
      lens.y,
      lens.radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    gradient.addColorStop(0.6, 'rgba(160, 185, 255, 0.18)');
    gradient.addColorStop(1, 'rgba(100, 110, 180, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, lens.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.28 * lens.visible;
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(180, 200, 255, 0.72)';
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, lens.innerRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function updateBloomState() {
    if (bloom.active) {
      bloom.frame += 1;
      const totalFrames = bloom.formFrames + bloom.holdFrames + bloom.releaseFrames;
      if (bloom.frame <= bloom.formFrames) {
        bloom.influence = easeOutCubic(bloom.frame / bloom.formFrames);
      } else if (bloom.frame <= bloom.formFrames + bloom.holdFrames) {
        bloom.influence = 1;
      } else if (bloom.frame <= totalFrames) {
        const t = (bloom.frame - bloom.formFrames - bloom.holdFrames) / bloom.releaseFrames;
        bloom.influence = 1 - easeOutCubic(t);
      } else {
        bloom.active = false;
        bloom.indexMap.clear();
        bloom.nodes = [];
        bloom.targets = [];
        bloom.edges = [];
        bloom.influence = 0;
        bloom.edgeIntensity = 0;
        lastBloomFrame = frame;
        return;
      }
      bloom.edgeIntensity = Math.pow(Math.max(bloom.influence, 0), 0.9);
    } else if (frame - lastBloomFrame > 420 && Math.random() < 0.01) {
      triggerBloom();
    }
  }

  function triggerBloom() {
    const availablePoints = layers.reduce((acc, layer) => acc.concat(layer.points), []);
    const candidates = bloomShapes.filter((shape) => shape.count <= availablePoints.length);
    if (!candidates.length) return;
    const shape = candidates[Math.floor(Math.random() * candidates.length)];
    const selected = [];
    const used = new Set();
    while (selected.length < shape.count) {
      const point = availablePoints[Math.floor(Math.random() * availablePoints.length)];
      if (used.has(point)) continue;
      used.add(point);
      selected.push(point);
    }

    const anchor = {
      x: width * (0.25 + Math.random() * 0.5),
      y: height * (0.3 + Math.random() * 0.4),
    };
    const radius = Math.min(width, height) * (0.18 + Math.random() * 0.12);
    const shapeData = shape.build(anchor, radius);
    if (!shapeData.targets || shapeData.targets.length !== shape.count) return;

    bloom.active = true;
    bloom.frame = 0;
    bloom.influence = 0;
    bloom.nodes = selected;
    bloom.targets = shapeData.targets;
    bloom.edges = shapeData.edges || [];
    bloom.indexMap = new Map();
    selected.forEach((point, index) => {
      bloom.indexMap.set(point, index);
    });
  }

  function mixColor(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animate() {
    frame += 1;
    updateLens();
    updateLayerOffsets();
    updateBloomState();
    const metrics = updatePoints();

    environment.targetEnergy = Math.min(1, metrics.avgSpeed * 1.2);
    environment.energy += (environment.targetEnergy - environment.energy) * 0.05;
    environment.focus += (metrics.magnetFocus - environment.focus) * 0.08;

    updateTrails();

    drawBackgroundGradient();
    drawFog();
    drawTrails();
    drawConnections();
    drawBloomEdges();
    drawNodes();
    drawLens();

    requestAnimationFrame(animate);
  }

  animate();
})();
