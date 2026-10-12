(() => {
  const canvas = document.querySelector("[data-section-particles]");
  const section = canvas?.closest("section");
  const context = canvas?.getContext("2d");
  if (!section || !context) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let particles = [];
  let frame = null;
  let previousTime = 0;
  let visible = true;

  const draw = (step = 0) => {
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const proximity = pointer.active && !motion.matches ? Math.max(0, 1 - distance / 170) : 0;
      if (step) {
        const force = proximity * proximity * 0.8;
        particle.pushX = (particle.pushX + dx / (distance || 1) * force * step) * Math.pow(0.92, step);
        particle.pushY = (particle.pushY + dy / (distance || 1) * force * step) * Math.pow(0.92, step);
        particle.x += (particle.vx + particle.pushX) * step;
        particle.y += (particle.vy + particle.pushY) * step;
        if (particle.x < -12) particle.x = width + 12;
        if (particle.x > width + 12) particle.x = -12;
        if (particle.y < -12) particle.y = height + 12;
        if (particle.y > height + 12) particle.y = -12;
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius + proximity * 0.7, 0, Math.PI * 2);
      context.fillStyle = `rgba(${proximity ? "255, 173, 198" : "224, 224, 230"}, ${particle.opacity + proximity * 0.3})`;
      context.fill();
    }
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const first = particles[i];
        const second = particles[j];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        if (distance >= 115) continue;
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(second.x, second.y);
        context.strokeStyle = `rgba(224, 224, 230, ${(1 - distance / 115) * 0.14})`;
        context.lineWidth = 0.65;
        context.stroke();
      }
    }
  };

  const animate = (time) => {
    const step = previousTime ? Math.min((time - previousTime) / 16.667, 2) : 1;
    previousTime = time;
    draw(step);
    frame = window.requestAnimationFrame(animate);
  };
  const sync = () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    previousTime = 0;
    if (!visible || document.hidden) return;
    if (motion.matches) draw();
    else frame = window.requestAnimationFrame(animate);
  };
  const resetPointer = () => { pointer.active = false; };
  const resize = () => {
    width = section.clientWidth;
    height = section.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(110, Math.max(30, Math.round(width * height / 11000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      pushX: 0, pushY: 0,
      radius: 0.8 + Math.random() * 1.2,
      opacity: 0.25 + Math.random() * 0.3,
    }));
    resetPointer();
    draw();
    sync();
  };

  section.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || motion.matches) return;
    const rect = section.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }, { passive: true });
  section.addEventListener("pointerleave", resetPointer);
  section.addEventListener("pointercancel", resetPointer);
  window.addEventListener("blur", resetPointer);
  window.addEventListener("scroll", resetPointer, { passive: true });
  document.addEventListener("visibilitychange", () => { resetPointer(); sync(); });
  motion.addEventListener("change", () => { resetPointer(); sync(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) resetPointer();
      sync();
    }).observe(section);
  }
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(section);
  else window.addEventListener("resize", resize);
})();
