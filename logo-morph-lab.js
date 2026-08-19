(() => {
  const W = 84.6667;
  const H = 50.8;
  const ROW = H / 3;
  const START_PATH = 'M 0 16.933 L 16.933 33.867 L 33.867 33.867 L 33.867 16.933 L 16.933 16.933 L 0 0 L 33.867 0 L 50.8 16.933 L 67.733 16.933 L 67.733 0 L 84.667 0 L 84.667 50.8 L 67.733 50.8 L 67.733 33.867 L 50.8 33.867 L 50.8 50.8 L 16.933 50.8 L 0 33.867 Z';

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

  // The codenames deliberately cover the parameters that most alter feel:
  // knot braking, spring frequency, damping ratio, segment allocation, and split timing.
  const variants = {
    kestrel: { stiffness: 420, damping: 38, knotBrake: 1, splitBrake: 1 },
    rail: { stiffness: 420, damping: 41, knotBrake: 0, splitBrake: 0 },
    mica: { stiffness: 260, damping: 32.25, knotBrake: 0.25, splitBrake: 0.25 },
    volt: { stiffness: 760, damping: 55.14, knotBrake: 0.25, splitBrake: 0.25 },
    plume: { stiffness: 170, damping: 26.08, knotBrake: 0.15, splitBrake: 0.15 },
    velvet: { stiffness: 260, damping: 44, knotBrake: 0.2, splitBrake: 0.2 },
    comet: { stiffness: 520, damping: 31, knotBrake: 0.15, splitBrake: 0.15 },
    tundra: { stiffness: 520, damping: 64, knotBrake: 0.2, splitBrake: 0.2 },
    pivot: {
      stiffness: 360,
      damping: 38,
      knotBrake: 0.2,
      splitBrake: 0.2,
      knots: [0, 0.24, 0.54, 1]
    },
    echo: {
      stiffness: 360,
      damping: 38,
      knotBrake: 0.2,
      splitBrake: 0.2,
      knots: [0, 0.42, 0.72, 1]
    },
    halo: { stiffness: 330, damping: 36, knotBrake: 0.1, splitBrake: 1 },
    sable: {
      stiffness: 330,
      damping: 36,
      knotBrake: 0.45,
      splitBrake: 0,
      shapeRendering: 'geometricPrecision'
    }
  };

  const hoverMedia = matchMedia('(hover: hover)');
  const motionMedia = matchMedia('(prefers-reduced-motion: reduce)');
  const defaultKnots = [0, 1 / 3, 2 / 3, 1];
  const mix = (from, to, amount) => from.map((point, index) => [
    point[0] + (to[index][0] - point[0]) * amount,
    point[1] + (to[index][1] - point[1]) * amount
  ]);
  const point = ([x, y]) => `${x.toFixed(3)} ${y.toFixed(3)}`;
  const ring = (points) => `M ${points.map(point).join(' L ')} Z`;
  const easedLocal = (amount, brake) => {
    const smooth = amount * amount * (3 - 2 * amount);
    return amount + (smooth - amount) * brake;
  };

  let keyboardMode = false;
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') keyboardMode = true;
  }, true);
  window.addEventListener('pointerdown', () => {
    keyboardMode = false;
  }, true);

  document.querySelectorAll('.specimen').forEach((button, index) => {
    const config = variants[button.dataset.variant];
    if (!config) return;

    const topId = `lab-clip-top-${index}`;
    const bottomId = `lab-clip-bottom-${index}`;
    button.insertAdjacentHTML('beforeend', `
      <svg class="specimen__logo" viewBox="0 0 ${W} ${H}" aria-hidden="true"
           xmlns="http://www.w3.org/2000/svg" shape-rendering="${config.shapeRendering || 'auto'}">
        <defs>
          <clipPath id="${topId}" clipPathUnits="userSpaceOnUse">
            <rect class="specimen__clip-top" x="0" y="0" width="${W}" height="${H / 2 + 0.05}"/>
          </clipPath>
          <clipPath id="${bottomId}" clipPathUnits="userSpaceOnUse">
            <rect class="specimen__clip-bottom" x="0" y="${H / 2 - 0.05}" width="${W}" height="${H / 2 + 0.05}"/>
          </clipPath>
        </defs>
        <path class="specimen__shape" clip-path="url(#${topId})" d="${START_PATH}"/>
        <path class="specimen__shape" clip-path="url(#${bottomId})" d="${START_PATH}"/>
      </svg>`);

    const shapes = [...button.querySelectorAll('.specimen__shape')];
    const topClip = button.querySelector('.specimen__clip-top');
    const bottomClip = button.querySelector('.specimen__clip-bottom');
    const knots = config.knots || defaultKnots;
    let amount = 0;
    let velocity = 0;
    let target = 0;
    let frame = 0;
    let previousTime = 0;
    let hovered = false;
    let keyboardFocused = false;
    let touchOpen = false;

    const render = () => {
      let segmentIndex = morphSegments.length - 1;
      for (let candidate = 0; candidate < morphSegments.length; candidate += 1) {
        if (amount < knots[candidate + 1]) {
          segmentIndex = candidate;
          break;
        }
      }

      const span = knots[segmentIndex + 1] - knots[segmentIndex];
      const local = Math.min(Math.max((amount - knots[segmentIndex]) / span, 0), 1);
      const eased = easedLocal(local, config.knotBrake);
      const [from, to] = morphSegments[segmentIndex];
      const outline = ring(mix(from, to, eased));
      shapes.forEach((shape) => shape.setAttribute('d', outline));

      const split = segmentIndex === morphSegments.length - 1
        ? easedLocal(local, config.splitBrake)
        : 0;
      const closedTop = H / 2 + 0.05;
      const closedBottom = H / 2 - 0.05;
      const topHeight = closedTop + (ROW - closedTop) * split;
      const bottomY = closedBottom + (ROW * 2 - closedBottom) * split;
      topClip.setAttribute('height', topHeight.toFixed(3));
      bottomClip.setAttribute('y', bottomY.toFixed(3));
      bottomClip.setAttribute('height', (H - bottomY).toFixed(3));
      button.dataset.amount = amount.toFixed(4);
    };

    const tick = (time) => {
      const delta = Math.min(Math.max((time - previousTime) / 1000, 0), 0.032);
      previousTime = time;
      velocity += ((target - amount) * config.stiffness - velocity * config.damping) * delta;
      amount += velocity * delta;

      if (amount <= 0 || amount >= 1) {
        amount = Math.min(Math.max(amount, 0), 1);
        velocity = 0;
      }
      render();

      if (Math.abs(target - amount) < 0.0005 && Math.abs(velocity) < 0.005) {
        amount = target;
        velocity = 0;
        frame = 0;
        render();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const setTarget = (nextTarget) => {
      target = nextTarget;
      if (motionMedia.matches) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        amount = target;
        velocity = 0;
        render();
      } else if (!frame) {
        previousTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    const sync = () => setTarget(hovered || keyboardFocused || touchOpen ? 1 : 0);

    button.addEventListener('pointerenter', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      hovered = true;
      sync();
    });
    button.addEventListener('pointerleave', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      hovered = false;
      sync();
    });
    button.addEventListener('focus', () => {
      keyboardFocused = keyboardMode;
      sync();
    });
    button.addEventListener('blur', () => {
      keyboardFocused = false;
      sync();
    });
    button.addEventListener('click', () => {
      if (hoverMedia.matches) return;
      touchOpen = !touchOpen;
      sync();
    });
    render();
  });
})();
