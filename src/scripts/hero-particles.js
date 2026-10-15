(() => {
  const canvas = document.querySelector("[data-hero-particles]");
  const hero = canvas?.closest(".hero");
  const stage = hero?.querySelector(".hero-particle-stage");
  const copy = hero?.querySelector(".hero-copy");
  const cursorRest = hero?.querySelector("[data-cursor-rest]");
  const context = canvas?.getContext("2d");
  if (!hero || !stage || !context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0, active: false };
  const interactionRadius = 110;
  const particleColor = "226, 26, 89"; // Project palette: --red (#e21a59).

  // Vertices traced from logo-bear.png: silhouette, ear, muzzle and paper folds.
  const vertices = {
    earTop: [771, 152], earTip: [831, 166], earRight: [856, 199],
    earLeft: [733, 201], earBase: [761, 258], earFold: [780, 249],
    crown: [965, 233], noseTop: [1060, 301], noseTip: [1121, 328],
    noseBottom: [1095, 384], jaw: [1012, 387], neck: [980, 438],
    chest: [964, 569], frontAnkle: [917, 943], frontToe: [823, 1017],
    frontNotch: [843, 888], belly: [748, 797], legFold: [703, 959],
    rightToe: [813, 1067], rightHeel: [670, 1067], innerHeel: [646, 1023],
    innerToe: [550, 1023], rearNotch: [446, 849], rearAnkle: [382, 983],
    leftToe: [469, 1067], leftHeel: [302, 1067], rumpLow: [246, 823],
    rump: [209, 655], back: [318, 443], shoulder: [577, 342],
    shoulderFold: [515, 638], backFold: [472, 599], elbow: [473, 730],
    armTip: [587, 919], chestFold: [710, 624], bibTip: [765, 741],
    bibFold: [838, 529], cheek: [644, 489], muzzleFold: [812, 353],
    eye: [948, 283],
  };
  const outline = [
    "earBase", "earLeft", "earTop", "earTip", "earRight", "crown",
    "noseTop", "noseTip", "noseBottom", "neck", "chest", "frontAnkle",
    "frontToe", "frontNotch", "belly", "legFold", "rightToe", "rightHeel",
    "innerHeel", "innerToe", "rearNotch", "rearAnkle", "leftToe", "leftHeel",
    "rumpLow", "rump", "back", "shoulder", "earBase",
  ];
  const folds = [
    ["earTop", "earFold"], ["earBase", "earRight"],
    ["back", "shoulderFold"], ["shoulder", "shoulderFold"],
    ["shoulder", "cheek"], ["crown", "cheek"],
    ["noseTop", "noseBottom"], ["muzzleFold", "noseBottom"],
    ["cheek", "jaw"], ["jaw", "noseBottom"], ["jaw", "chestFold"],
    ["cheek", "chestFold"], ["chestFold", "bibTip"],
    ["bibFold", "bibTip"], ["bibTip", "chest"],
    ["chestFold", "armTip"], ["armTip", "elbow"],
    ["elbow", "shoulderFold"], ["backFold", "rumpLow"],
    ["shoulderFold", "leftHeel"], ["armTip", "innerToe"],
    ["armTip", "rightHeel"], ["bibTip", "rightHeel"],
  ];
  const segments = [
    ...outline.slice(1).map((name, index) => [outline[index], name]),
    ...folds,
  ];
  let width = 0;
  let height = 0;
  let particles = [];
  let links = [];
  let frame = null;
  let lastTime = 0;
  let visible = true;
  let formationEmphasis = 0;

  const draw = (step = 0) => {
    context.clearRect(0, 0, width, height);
    const forming = !pointer.active || reducedMotion.matches;
    for (const particle of particles) {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const proximity = !forming ? Math.max(0, 1 - distance / interactionRadius) : 0;
      if (step) {
        const targetX = forming ? particle.targetX : particle.scatterX;
        const targetY = forming ? particle.targetY : particle.scatterY;
        const attraction = forming ? 0.0025 : 0.0002;
        const force = proximity * proximity * 0.22;
        const damping = Math.pow(0.84, step);
        particle.vx = (particle.vx + ((targetX - particle.x) * attraction + dx / (distance || 1) * force) * step) * damping;
        particle.vy = (particle.vy + ((targetY - particle.y) * attraction + dy / (distance || 1) * force) * step) * damping;
        const speed = Math.hypot(particle.vx, particle.vy);
        const maxSpeed = forming ? 2.4 : 0.9;
        if (speed > maxSpeed) {
          particle.vx *= maxSpeed / speed;
          particle.vy *= maxSpeed / speed;
        }
        particle.x += particle.vx * step;
        particle.y += particle.vy * step;
      }
      particle.settled = forming
        ? Math.max(0, 1 - Math.hypot(particle.x - particle.targetX, particle.y - particle.targetY) / 65)
        : 0;
    }

    // Springs approach their targets asymptotically; 1px is visually complete.
    const fullyFormed = forming && particles.length > 0 && particles.every(
      (particle) => Math.hypot(particle.x - particle.targetX, particle.y - particle.targetY) <= 1,
    );
    formationEmphasis = fullyFormed
      ? (reducedMotion.matches ? 1 : formationEmphasis + (1 - formationEmphasis) * (1 - Math.pow(0.9, step)))
      : 0;
    context.shadowColor = `rgba(${particleColor}, 0.85)`;
    context.shadowBlur = 10;
    for (const particle of particles) {
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius * (1.85 + formationEmphasis * 0.3), 0, Math.PI * 2);
      context.fillStyle = `rgba(${particle.color}, ${particle.opacity})`;
      context.fill();
    }
    context.shadowBlur = 0;
    // Only connect neighbors on each paper fold, keeping drawing cost linear.
    for (const [from, to] of links) {
      const first = particles[from];
      const second = particles[to];
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      if (distance > 32) continue;
      const settled = Math.min(first.settled, second.settled);
      context.beginPath();
      context.moveTo(first.x, first.y);
      context.lineTo(second.x, second.y);
      context.strokeStyle = `rgba(${particleColor}, ${(1 - distance / 40) * (0.12 + settled * 0.65)})`;
      context.lineWidth = 0.75;
      context.stroke();
    }
  };

  const animate = (time) => {
    const step = lastTime ? Math.min((time - lastTime) / 16.667, 2) : 1;
    lastTime = time;
    draw(step);
    frame = window.requestAnimationFrame(animate);
  };
  const syncAnimation = () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    lastTime = 0;
    hero.classList.toggle("is-animation-paused", !visible || document.hidden);
    if (!visible || document.hidden) return;
    if (reducedMotion.matches) {
      for (const particle of particles) {
        particle.x = particle.targetX;
        particle.y = particle.targetY;
        particle.vx = 0;
        particle.vy = 0;
      }
      draw();
      return;
    }
    frame = window.requestAnimationFrame(animate);
  };
  const resize = () => {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const heroRect = hero.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    // DOM bounds include the page's CSS zoom; canvas coordinates do not.
    const scaleX = width / Math.max(heroRect.width, 1);
    const scaleY = height / Math.max(heroRect.height, 1);
    const stageWidth = stageRect.width * scaleX;
    const stageHeight = stageRect.height * scaleY;
    let size = Math.min(stageWidth, stageHeight) * 0.92;
    let left = (stageRect.left - heroRect.left) * scaleX + (stageWidth - size) / 2;
    let top = (stageRect.top - heroRect.top) * scaleY + (stageHeight - size) / 2;

    if (window.matchMedia("(min-width: 981px)").matches && copy) {
      const copyRect = copy.getBoundingClientRect();
      const gap = Math.min(56, width * 0.03);
      const availableLeft = (copyRect.right - heroRect.left) * scaleX + gap;
      const availableRight = width - Math.min(120, Math.max(48, width * 0.06));
      const availableWidth = Math.max(0, availableRight - availableLeft);
      size = Math.min(660, height * 0.72, availableWidth);
      left = availableLeft + (availableWidth - size) / 2;
      const centerY = (stageRect.top - heroRect.top) * scaleY + stageHeight / 2;
      top = Math.max(112, Math.min(centerY - size / 2, height - size - 48));
    }
    const scale = size / 915;
    particles = [];
    links = [];
    const addParticle = (x, y, radius = 0.85) => {
      const scatterX = Math.random() * width;
      const scatterY = Math.random() * height;
      // Assign each point a permanent shade, independent of cursor or formation.
      const luminosity = Math.random() < 0.25
        ? 0.65 + Math.random() * 0.35
        : Math.random() * 0.3;
      particles.push({
        x: scatterX, y: scatterY, scatterX, scatterY,
        targetX: left + (x - 209) * scale,
        targetY: top + (y - 152) * scale,
        vx: 0, vy: 0, radius,
        color: `${Math.round(226 + 29 * luminosity)}, ${Math.round(26 + 128 * luminosity)}, ${Math.round(89 + 91 * luminosity)}`,
        opacity: 0.9 + Math.random() * 0.1,
        settled: 0,
      });
    };
    for (const [from, to] of segments) {
      const start = vertices[from];
      const end = vertices[to];
      const originalCount = Math.ceil(Math.hypot(end[0] - start[0], end[1] - start[1]) / 22) + 1;
      // Halve the particle count while preserving both endpoints of each fold.
      const steps = Math.max(2, Math.round(originalCount / 2)) - 1;
      for (let i = 0; i <= steps; i += 1) {
        const progress = i / steps;
        addParticle(start[0] + (end[0] - start[0]) * progress, start[1] + (end[1] - start[1]) * progress);
        if (i) links.push([particles.length - 2, particles.length - 1]);
      }
    }
    addParticle(...vertices.eye, 2.2);
    pointer.active = false;
    draw();
    syncAnimation();
  };
  const updatePointer = (event) => {
    if (event.pointerType === "touch" || reducedMotion.matches) return;
    const rect = hero.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) * width / Math.max(rect.width, 1);
    pointer.y = (event.clientY - rect.top) * height / Math.max(rect.height, 1);
    pointer.active = !cursorRest?.contains(event.target);
  };
  hero.addEventListener("pointerenter", updatePointer, { passive: true });
  hero.addEventListener("pointermove", updatePointer, { passive: true });
  const resetPointer = () => { pointer.active = false; };
  cursorRest?.addEventListener("pointerenter", resetPointer);
  cursorRest?.addEventListener("focus", resetPointer);
  cursorRest?.addEventListener("click", resetPointer);
  hero.addEventListener("pointerleave", resetPointer);
  hero.addEventListener("pointercancel", resetPointer);
  window.addEventListener("blur", resetPointer);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetPointer();
    syncAnimation();
  });
  reducedMotion.addEventListener("change", () => {
    resetPointer();
    syncAnimation();
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) resetPointer();
      syncAnimation();
    });
    observer.observe(hero);
  }
  resize();
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(resize);
    observer.observe(hero);
    observer.observe(stage);
    if (copy) observer.observe(copy);
  } else {
    window.addEventListener("resize", resize);
  }
})();
