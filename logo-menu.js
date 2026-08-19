(() => {
  const logo = document.querySelector('.logo');
  const menu = document.getElementById('site-menu');
  const shape = logo?.querySelector('.logo__shape');
  if (!logo || !menu || !shape) return;

  const W = 84.6667;
  const H = 50.8;
  const ROW = H / 3;

  // The original mark and the menu state share one 18-point outline. The menu
  // state adds an expanding even-odd cutout, yielding two separate bars without
  // a sprite sheet or hand-authored in-between frames.
  const markOutline = [
    [0, ROW], [ROW, ROW * 2], [ROW * 2, ROW * 2],
    [ROW * 2, ROW], [ROW, ROW], [0, 0],
    [ROW * 2, 0], [ROW * 3, ROW], [ROW * 4, ROW],
    [ROW * 4, 0], [W, 0], [W, H],
    [ROW * 4, H], [ROW * 4, ROW * 2], [ROW * 3, ROW * 2],
    [ROW * 3, H], [ROW, H], [0, ROW * 2]
  ];

  const barOutline = [
    [0, ROW], [0, ROW * 0.8], [0, ROW * 0.6],
    [0, ROW * 0.4], [0, ROW * 0.2], [0, 0],
    [ROW, 0], [ROW * 2, 0], [ROW * 3, 0],
    [ROW * 4, 0], [W, 0], [W, H],
    [ROW * 4, H], [ROW * 3.5, H], [ROW * 3, H],
    [ROW * 2, H], [ROW, H], [0, H]
  ];

  const closedCutout = Array.from({ length: 4 }, () => [W / 2, H / 2]);
  const openCutout = [[0, ROW], [W, ROW], [W, ROW * 2], [0, ROW * 2]];
  const mix = (from, to, amount) => from.map((point, index) => [
    point[0] + (to[index][0] - point[0]) * amount,
    point[1] + (to[index][1] - point[1]) * amount
  ]);
  const point = ([x, y]) => `${x.toFixed(3)} ${y.toFixed(3)}`;
  const ring = (points) => `M ${points.map(point).join(' L ')} Z`;
  const render = (amount) => {
    shape.setAttribute('d', `${ring(mix(markOutline, barOutline, amount))} ${ring(mix(closedCutout, openCutout, amount))}`);
  };

  const hoverMedia = matchMedia('(hover: hover)');
  const motionMedia = matchMedia('(prefers-reduced-motion: reduce)');
  let amount = 0;
  let velocity = 0;
  let target = 0;
  let frame = 0;
  let previousTime = 0;
  let hovered = false;

  const tick = (time) => {
    const delta = Math.min(Math.max((time - previousTime) / 1000, 0), 0.032);
    previousTime = time;

    // A critically damped spring preserves velocity when hover reverses midway.
    velocity += ((target - amount) * 420 - velocity * 38) * delta;
    amount += velocity * delta;

    if (amount <= 0 || amount >= 1) {
      amount = Math.min(Math.max(amount, 0), 1);
      velocity = 0;
    }
    render(amount);

    if (Math.abs(target - amount) < 0.0005 && Math.abs(velocity) < 0.005) {
      amount = target;
      velocity = 0;
      frame = 0;
      render(amount);
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  const setMorphTarget = (nextTarget) => {
    target = nextTarget;
    if (motionMedia.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      amount = target;
      velocity = 0;
      render(amount);
    } else if (!frame) {
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  const syncMorph = () => setMorphTarget(
    document.body.classList.contains('menu-open') ||
    (hoverMedia.matches && hovered) ? 1 : 0
  );

  const setOpen = (open) => {
    document.body.classList.toggle('menu-open', open);
    logo.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    syncMorph();
  };
  const isOpen = () => document.body.classList.contains('menu-open');
  const toggle = () => setOpen(!isOpen());

  logo.addEventListener('pointerenter', () => {
    hovered = true;
    syncMorph();
  });
  logo.addEventListener('pointerleave', () => {
    hovered = false;
    syncMorph();
  });
  logo.addEventListener('click', toggle);
  logo.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  });
  menu.addEventListener('click', (event) => {
    if (event.target.closest('.menu__link')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) setOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (isOpen() && !event.target.closest('.menu') && !event.target.closest('.logo')) {
      setOpen(false);
    }
  });
  hoverMedia.addEventListener('change', syncMorph);
  motionMedia.addEventListener('change', syncMorph);

  render(0);
})();
