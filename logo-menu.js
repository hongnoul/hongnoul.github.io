(() => {
  const logo = document.querySelector('.logo');
  const menu = document.getElementById('site-menu');
  const shapes = logo ? [...logo.querySelectorAll('.logo__shape')] : [];
  const topClip = logo?.querySelector('.logo__clip-top');
  const bottomClip = logo?.querySelector('.logo__clip-bottom');
  if (!logo || !menu || shapes.length !== 2 || !topClip || !bottomClip) return;

  const W = 84.6667;
  const H = 50.8;
  const ROW = H / 3;

  // Each adjacent pair is registered independently. Collinear points preserve
  // every authored corner while these explicit correspondences avoid folds.
  const grid = (points) => points.map(([x, y]) => [
    x === 5 ? W : x * ROW,
    y === 3 ? H : y * ROW
  ]);
  const morphSegments = [
    [
      grid([[0, 1], [1, 2], [2, 2], [2, 1], [1, 1], [0, 0],
        [2, 0], [3, 1], [4, 1], [4, 0], [5, 0], [5, 3],
        [4, 3], [4, 2], [3, 2], [3, 3], [1, 3], [0, 2]]),
      grid([[0, 2], [2, 2], [2, 1], [0, 1], [0, 0], [2, 0],
        [3, 1], [3, 2], [4, 2], [4, 1], [4, 0], [5, 0],
        [5, 1.5], [5, 3], [4, 3], [3, 3], [2, 3], [1, 3]])
    ],
    [
      grid([[0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [1, 2],
        [0, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
        [5, 2.25], [5, 1.5], [5, 0], [4, 0], [4, 1], [4, 2],
        [3, 2], [3, 1], [2, 0], [1, 0]]),
      grid([[0.75, 1], [1.5, 1], [2.25, 1], [3, 1], [3, 2], [1.5, 2],
        [0, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
        [5, 2], [4, 2], [4, 1], [5, 1], [5, 0], [3.75, 0],
        [2.5, 0], [1.25, 0], [0, 0], [0, 1]])
    ],
    [
      grid([[0, 0], [0, 1], [3, 1], [3, 2], [0, 2], [1, 3],
        [5, 3], [5, 2], [4, 2], [4, 1], [5, 1], [5, 0]]),
      grid([[1.25, 0], [0, 0], [0, 1.5], [0, 3], [1.25, 3], [2.5, 3],
        [3.75, 3], [5, 3], [5, 1.5], [5, 0], [3.75, 0], [2.5, 0]])
    ]
  ];

  const mix = (from, to, amount) => from.map((point, index) => [
    point[0] + (to[index][0] - point[0]) * amount,
    point[1] + (to[index][1] - point[1]) * amount
  ]);
  const point = ([x, y]) => `${x.toFixed(3)} ${y.toFixed(3)}`;
  const ring = (points) => `M ${points.map(point).join(' L ')} Z`;
  const render = (amount) => {
    const position = Math.min(Math.max(amount, 0), 1) * morphSegments.length;
    const segmentIndex = Math.min(Math.floor(position), morphSegments.length - 1);
    const local = position - segmentIndex;
    const eased = local * local * (3 - 2 * local);
    const [from, to] = morphSegments[segmentIndex];
    const outline = ring(mix(from, to, eased));
    shapes.forEach((shape) => shape.setAttribute('d', outline));

    // Frames one through three remain whole. During only the final segment,
    // two overlapping clips separate from the center into the authored bars.
    const split = segmentIndex === morphSegments.length - 1 ? eased : 0;
    const closedTop = H / 2 + 0.05;
    const closedBottom = H / 2 - 0.05;
    const topHeight = closedTop + (ROW - closedTop) * split;
    const bottomY = closedBottom + (ROW * 2 - closedBottom) * split;
    topClip.setAttribute('height', topHeight.toFixed(3));
    bottomClip.setAttribute('y', bottomY.toFixed(3));
    bottomClip.setAttribute('height', (H - bottomY).toFixed(3));
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

  const setOpen = (open, restoreFocus = false) => {
    document.body.classList.toggle('menu-open', open);
    logo.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    menu.toggleAttribute('inert', !open);
    syncMorph();
    if (!open && restoreFocus) logo.focus();
  };
  const isOpen = () => document.body.classList.contains('menu-open');
  const toggle = () => setOpen(!isOpen());

  logo.addEventListener('pointerenter', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    hovered = true;
    syncMorph();
  });
  logo.addEventListener('pointerleave', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
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
    const link = event.target.closest('.menu__link');
    if (link) setOpen(false, link.tagName === 'BUTTON');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) setOpen(false, true);
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
