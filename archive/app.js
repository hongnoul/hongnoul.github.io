const COL_WIDTH = 25;
const DURATIONS = [2.3,2.4,2.5,2.6,2.7,2.8,2.9,3,3.1,3.2,3.3,3.4,3.5,3.6,3.7,3.8,3.9,4,4.1,4.2,4.3,4.4,4.5];
const DELAYS    = [-1.5,-1.6,-1.7,-1.8,-1.9,-2,-2.1,-2.2,-2.3,-2.4,-2.5,-2.6,-2.7,-2.8,-2.9,-3,-3.1,-3.2,-3.3,-3.4,-3.5,-3.6,-3.7,-3.8,-3.9,-4];

const pattern = document.querySelector('.matrix-pattern');

const build = () => {
  const count = Math.ceil(window.innerWidth / COL_WIDTH) + 1;
  pattern.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const col = document.createElement('div');
    col.className = 'matrix-column';
    col.style.cssText = `left:${i * COL_WIDTH}px;animation-delay:${DELAYS[i % DELAYS.length]}s;animation-duration:${DURATIONS[i % DURATIONS.length]}s`;
    pattern.appendChild(col);
  }
};

build();
let raf;
window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(build); });
