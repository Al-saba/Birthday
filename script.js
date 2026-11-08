/* =========================================================
   EDIT THESE TEXTS to personalise the page
   ========================================================= */
const CONFIG = {
  name: "Dear Sister",
  wish:
    "May this new year of your life bring you good health, quiet joy, and every good thing you hope for. " +
    "You are cherished more than words can say, today and always.",
  signature: "With love and best wishes"
};

/* ---------- helpers ---------- */
const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

$('#name').textContent = CONFIG.name;
$('#wishTitle').textContent = 'Happy Birthday, ' + CONFIG.name;
$('#wishText').textContent = CONFIG.wish;
$('#wishSign').textContent = CONFIG.signature;

/* ---------- falling leaves (background) ---------- */
(function leaves() {
  const box = $('#leaves');
  const colors = ['#7ea66f', '#a3c293', '#5f8f5a', '#c4d6a8', '#8fb07a'];
  for (let i = 0; i < 14; i++) {
    const l = document.createElement('span');
    l.className = 'fall';
    const s = 12 + Math.random() * 18;
    l.style.width = s + 'px';
    l.style.height = s + 'px';
    l.style.left = Math.random() * 100 + '%';
    l.style.background = colors[i % colors.length];
    l.style.animationDuration = 14 + Math.random() * 14 + 's';
    l.style.animationDelay = -Math.random() * 20 + 's';
    box.appendChild(l);
  }
})();

/* =========================================================
   TASKS
   Each task: { title, prompt, render(box, { pass, fail }) }
   A wrong answer calls fail() -> the whole journey restarts.
   ========================================================= */
const TASKS = [
  {
    title: 'The Odd One Out',
    prompt: 'One of these does not belong in a forest. Choose it.',
    render(box, { pass, fail }) {
      const items = shuffle(['🌳', '🌲', '🌴', '🌿', '🚗']);
      box.innerHTML = '<div class="emojis"></div>';
      const wrap = box.firstChild;
      items.forEach((e) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'emoji';
        b.textContent = e;
        b.setAttribute('aria-label', e);
        b.onclick = () => (e === '🚗' ? pass() : fail());
        wrap.appendChild(b);
      });
    }
  },
  {
    title: 'The Memory Path',
    prompt: 'Watch the sequence carefully, then repeat it in the same order.',
    render(box, { pass, fail }) {
      const icons = ['🌞', '🍃', '💧', '🌸'];
      const seq = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4));
      let pos = 0;
      let ready = false;
      box.innerHTML =
        '<div class="pads">' +
        icons.map((ic, i) => `<button type="button" class="pad" data-i="${i}" disabled>${ic}</button>`).join('') +
        '</div><button type="button" class="primary" id="play">Show the sequence</button>';
      const pads = [...box.querySelectorAll('.pad')];
      const play = box.querySelector('#play');
      const flash = (i) => {
        pads[i].classList.add('lit');
        setTimeout(() => pads[i].classList.remove('lit'), 450);
      };
      play.onclick = async () => {
        play.disabled = true;
        play.textContent = 'Watch closely…';
        pos = 0;
        for (const i of seq) {
          await wait(300);
          flash(i);
          await wait(650);
        }
        pads.forEach((p) => (p.disabled = false));
        ready = true;
        play.textContent = 'Now repeat it';
      };
      pads.forEach((p) => {
        p.onclick = () => {
          if (!ready) return;
          const i = Number(p.dataset.i);
          flash(i);
          if (i !== seq[pos]) {
            ready = false;
            fail();
            return;
          }
          pos++;
          if (pos === seq.length) {
            ready = false;
            pass();
          }
        };
      });
    }
  },
  {
    title: 'The Scrambled Bloom',
    prompt: 'Rearrange the letters to name a tall yellow flower that follows the sun.',
    render(box, { pass, fail }) {
      const word = 'SUNFLOWER';
      let letters = shuffle(word.split(''));
      while (letters.join('') === word) letters = shuffle(word.split(''));
      box.innerHTML =
        '<div class="tiles">' + letters.map((l) => `<span class="tile">${l}</span>`).join('') + '</div>' +
        '<form id="f"><input class="answer" id="ans" type="text" maxlength="20" autocomplete="off" placeholder="Your answer" aria-label="Your answer" />' +
        '<button class="primary" type="submit">Submit</button></form>';
      const form = box.querySelector('#f');
      const input = box.querySelector('#ans');
      form.onsubmit = (e) => {
        e.preventDefault();
        const v = input.value.trim().toUpperCase();
        if (!v) return;
        v === word ? pass() : fail();
      };
      setTimeout(() => input.focus(), 50);
    }
  },
  {
    title: 'The Pairs of the Meadow',
    prompt: 'Turn the cards and find all four matching pairs. You may make at most five wrong attempts.',
    render(box, { pass, fail }) {
      const icons = ['🦋', '🌻', '🍄', '🐝'];
      const deck = shuffle([...icons, ...icons]);
      let first = null;
      let lock = false;
      let matched = 0;
      let lives = 5;
      box.innerHTML =
        '<p class="meta">Wrong attempts left: <b id="lives">5</b></p><div class="cards"></div>';
      const wrap = box.querySelector('.cards');
      const livesEl = box.querySelector('#lives');
      deck.forEach((icon) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'card-btn';
        b.dataset.icon = icon;
        b.setAttribute('aria-label', 'Hidden card');
        b.innerHTML = '<span class="back">🍃</span><span class="face">' + icon + '</span>';
        b.onclick = async () => {
          if (lock || b.classList.contains('flipped')) return;
          b.classList.add('flipped');
          if (!first) {
            first = b;
            return;
          }
          const a = first;
          first = null;
          if (a.dataset.icon === b.dataset.icon) {
            a.classList.add('matched');
            b.classList.add('matched');
            matched++;
            if (matched === icons.length) {
              lock = true;
              await wait(500);
              pass();
            }
            return;
          }
          lock = true;
          lives--;
          livesEl.textContent = lives;
          await wait(850);
          if (lives <= 0) {
            fail();
            return;
          }
          a.classList.remove('flipped');
          b.classList.remove('flipped');
          lock = false;
        };
        wrap.appendChild(b);
      });
    }
  },
  {
    title: 'The Final Garden Puzzle',
    prompt:
      'Slide the tiles into order, 1 to 8, with the empty space in the last corner. You have 70 moves. This one is not easy.',
    render(box, { pass, fail }) {
      const LIMIT = 150;
      const tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
      let empty = 8;
      let moves = 0;
      let over = false;
      const neighbours = (i) => {
        const r = Math.floor(i / 3);
        const c = i % 3;
        const n = [];
        if (r > 0) n.push(i - 3);
        if (r < 2) n.push(i + 3);
        if (c > 0) n.push(i - 1);
        if (c < 2) n.push(i + 1);
        return n;
      };
      const isSolved = () => tiles.every((t, i) => (i === 8 ? t === 0 : t === i + 1));

      // scramble with legal moves only, so it is always solvable
      do {
        let prev = -1;
        for (let k = 0; k < 70; k++) {
          const opts = neighbours(empty).filter((x) => x !== prev);
          const t = opts[Math.floor(Math.random() * opts.length)];
          [tiles[empty], tiles[t]] = [tiles[t], tiles[empty]];
          prev = empty;
          empty = t;
        }
      } while (isSolved());

      box.innerHTML =
        '<p class="meta">Moves: <b id="moves">0</b> / ' + LIMIT + '</p><div class="slides"></div>';
      const grid = box.querySelector('.slides');
      const movesEl = box.querySelector('#moves');

      const draw = () => {
        grid.innerHTML = '';
        tiles.forEach((t, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'slide' + (t === 0 ? ' blank' : '');
          b.textContent = t === 0 ? '' : t;
          if (t === 0) b.disabled = true;
          b.onclick = async () => {
            if (over || !neighbours(empty).includes(i)) return;
            [tiles[empty], tiles[i]] = [tiles[i], tiles[empty]];
            empty = i;
            moves++;
            movesEl.textContent = moves;
            draw();
            if (isSolved()) {
              over = true;
              await wait(500);
              pass();
            } else if (moves >= LIMIT) {
              over = true;
              await wait(600);
              fail();
            }
          };
          grid.appendChild(b);
        });
      };
      draw();
    }
  }
];

/* ---------- task engine ---------- */
const progressEl = $('#progress');
const stepLabel = $('#stepLabel');
const titleEl = $('#taskTitle');
const promptEl = $('#taskPrompt');
const bodyEl = $('#taskBody');
const feedback = $('#feedback');
const tasksCard = $('#tasksCard');

let current = 0;
let busy = false;

function drawProgress() {
  progressEl.innerHTML = '';
  TASKS.forEach((_, i) => {
    const l = document.createElement('span');
    l.className = 'leaf' + (i < current ? ' done' : i === current ? ' current' : '');
    progressEl.appendChild(l);
  });
}

function setFeedback(text, kind) {
  feedback.textContent = text || '';
  feedback.className = 'feedback' + (kind ? ' ' + kind : '');
}

function showTask() {
  busy = false;
  drawProgress();
  setFeedback('');
  const t = TASKS[current];
  stepLabel.textContent = `Task ${current + 1} of ${TASKS.length}`;
  titleEl.textContent = t.title;
  promptEl.textContent = t.prompt;
  bodyEl.innerHTML = '';
  bodyEl.className = 'fade-in';
  t.render(bodyEl, { pass: onPass, fail: onFail });
}

async function onPass() {
  if (busy) return;
  busy = true;
  current++;
  drawProgress();
  setFeedback('Correct. Well done.', 'ok');
  await wait(1000);
  if (current >= TASKS.length) return allDone();
  showTask();
}

async function onFail() {
  if (busy) return;
  busy = true;
  setFeedback('That is not correct. The journey begins again from the first task.', 'bad');
  tasksCard.classList.remove('shake');
  void tasksCard.offsetWidth;
  tasksCard.classList.add('shake');
  bodyEl.querySelectorAll('button, input').forEach((el) => (el.disabled = true));
  await wait(2000);
  current = 0;
  showTask();
}

function allDone() {
  stepLabel.textContent = 'All tasks complete';
  titleEl.textContent = 'Splendidly Done';
  promptEl.textContent = 'The knife has been unlocked. Please cut the cake.';
  bodyEl.innerHTML = '';
  setFeedback('');
  unlockKnife();
}

/* =========================================================
   KNIFE & CAKE
   ========================================================= */
const stage = $('#stage');
const knife = $('#knife');
const guide = $('#guide');
const hint = $('#hint');

let knifeReady = false;
let cutDone = false;
let drag = null;

function unlockKnife() {
  knifeReady = true;
  knife.classList.remove('locked');
  knife.classList.add('ready');
  knife.setAttribute('aria-label', 'Knife (unlocked). Drag down the dotted line, or press Enter, to cut the cake.');
  stage.classList.add('ready');
  hint.textContent = 'Drag the knife down along the dotted line to cut the cake. (You may also simply tap the knife.)';
}

knife.addEventListener('pointerdown', (e) => {
  if (!knifeReady || cutDone) return;
  knife.setPointerCapture(e.pointerId);
  knife.classList.add('dragging');
  drag = { sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, moved: 0 };
});

knife.addEventListener('pointermove', (e) => {
  if (!drag) return;
  drag.dx = e.clientX - drag.sx;
  drag.dy = e.clientY - drag.sy;
  drag.moved = Math.max(drag.moved, Math.hypot(drag.dx, drag.dy));
  knife.style.transform = `translate(${drag.dx}px, ${drag.dy}px)`;
  const k = knife.getBoundingClientRect();
  const g = guide.getBoundingClientRect();
  const nearX = Math.abs(k.left + k.width / 2 - g.left) < 34;
  const deepEnough = k.bottom > g.top + g.height * 0.7;
  if (nearX && deepEnough) finishCut(true);
});

knife.addEventListener('pointerup', () => {
  if (!drag) return;
  const tapped = drag.moved < 6;
  drag = null;
  knife.classList.remove('dragging');
  if (cutDone) return;
  if (tapped) return finishCut(false);
  knife.style.transform = ''; // spring back
});

knife.addEventListener('pointercancel', () => {
  drag = null;
  knife.classList.remove('dragging');
  if (!cutDone) knife.style.transform = '';
});

knife.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && knifeReady && !cutDone) {
    e.preventDefault();
    finishCut(false);
  }
});

async function finishCut() {
  if (cutDone) return;
  cutDone = true;
  drag = null;
  knife.classList.remove('dragging');

  // snap the knife onto the cutting line, tip at the plate
  knife.style.transform = '';
  const k = knife.getBoundingClientRect();
  const g = guide.getBoundingClientRect();
  const dx = g.left - (k.left + k.width / 2);
  const dy = g.top + g.height - k.bottom;
  knife.style.transition = 'transform .6s cubic-bezier(.3,.8,.3,1), opacity 1s';
  knife.style.transform = `translate(${dx}px, ${dy}px)`;

  await wait(700);
  stage.classList.add('cut');
  hint.textContent = 'The cake has been cut. Happy Birthday!';
  await wait(500);
  knife.classList.add('gone');
  startConfetti();

  const wish = $('#wish');
  wish.hidden = false;
  await wait(500);
  wish.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

$('#again').addEventListener('click', () => location.reload());

/* =========================================================
   CONFETTI (petals & leaves)
   ========================================================= */
function startConfetti() {
  const canvas = $('#confetti');
  const ctx = canvas.getContext('2d');
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#f4b6c2', '#f6e08a', '#a9c3a0', '#7ea66f', '#fffaf0', '#d9a441', '#c8e0b8'];
  const pieces = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.6,
    w: 6 + Math.random() * 8,
    h: 10 + Math.random() * 10,
    r: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.15,
    vx: (Math.random() - 0.5) * 1.6,
    vy: 1.4 + Math.random() * 2.4,
    c: colors[Math.floor(Math.random() * colors.length)]
  }));

  const t0 = performance.now();
  (function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.x += p.vx + Math.sin((now + p.y * 6) / 600) * 0.6;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    if (now - t0 < 7000) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })(t0);
}

/* ---------- start ---------- */
showTask();
