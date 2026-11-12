/* ============================================================
 * 猫格档案馆 · 交互
 * ------------------------------------------------------------
 * 0. 状态与启动
 * 1. 口令门
 * 2. 封面
 * 3. 答题
 * 4. 结算与结果渲染
 * 5. 分享文案
 * 6. 海报生成（Canvas）与保存
 * ============================================================ */
(function () {
  'use strict';

  const DATA = window.CAT_DATA;
  const SCORING = window.CatScoring;
  const ART = window.CatArt;
  const DIMS = DATA.dimensions;
  const TYPES = DATA.types;
  const QS = DATA.questions;
  const PASSCODE = DATA.passcode;
  const UNLOCK_KEY = 'catArchive.unlocked';
  const INK = '#2D2723';
  const PAPER = '#F4EBDD';
  const PAPER_LIGHT = '#FBF7EE';
  const YELLOW = '#F2C14E';
  const RED = '#E5543D';
  const FONT_SANS = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",Arial,sans-serif';
  const FONT_SERIF = '"Songti SC","STSong","Noto Serif SC","SimSun",serif';
  const FONT_MONO = '"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace';

  const $ = (id) => document.getElementById(id);
  const screens = {
    gate: $('screen-gate'),
    cover: $('screen-cover'),
    quiz: $('screen-quiz'),
    loading: $('screen-loading'),
    result: $('screen-result'),
  };

  const state = {
    unlocked: false,
    currentScreen: 'gate',
    qi: 0,
    answers: new Array(QS.length).fill(null),
    result: null,
    serial: '',
    posterBlob: null,
    posterDataUrl: '',
    posterFile: null,
    posterPromise: null,
    finishing: false,
    countAnimated: false,
    loadingTimer: 0,
    toastTimer: 0,
    lastFocus: null,
  };

  const dom = {
    gateForm: $('gate-form'),
    gateInput: $('gate-input'),
    gateError: $('gate-error'),
    gateSubmit: $('gate-submit'),
    pinField: $('pin-field'),
    pinBoxes: Array.from(document.querySelectorAll('.pin-box')),
    coverCount: $('cat-count'),
    quizCurrent: $('quiz-current'),
    qScene: $('q-scene'),
    qNumber: $('q-number'),
    qTitle: $('q-title'),
    options: $('options'),
    progress: $('progress'),
    progressFill: $('progress-fill'),
    btnPrev: $('btn-prev'),
    btnNext: $('btn-next'),
    quizCard: $('quiz-card'),
    loadingCat: $('loading-cat'),
    loadingSub: $('loading-sub'),
    resultCard: $('result-card'),
    resultArt: $('result-art'),
    matchValue: $('match-value'),
    fileNo: $('file-no'),
    resultName: $('result-name'),
    resultTitle: $('result-title'),
    resultEn: $('result-en'),
    resultQuote: $('result-quote'),
    resultDesc: $('result-desc'),
    resultTags: $('result-tags'),
    radar: $('radar'),
    dimList: $('dim-list'),
    typeBars: $('type-bars'),
    loveText: $('love-text'),
    rechargeText: $('recharge-text'),
    strengthList: $('strength-list'),
    blindText: $('blind-text'),
    careList: $('care-list'),
    bestArt: $('best-art'),
    bestName: $('best-name'),
    bestWhy: $('best-why'),
    clashArt: $('clash-art'),
    clashName: $('clash-name'),
    clashWhy: $('clash-why'),
    rarity: $('rarity'),
    posterModal: $('poster-modal'),
    posterImg: $('poster-img'),
    posterLoading: $('poster-loading'),
    btnPosterSave: $('btn-poster-save'),
    btnPosterClose: $('btn-poster-close'),
    btnClosePoster: $('btn-close-poster'),
    toast: $('toast'),
  };

  /* ============================================================
   * 0. 基础工具 / 启动
   * ============================================================ */

  function safeSessionGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      return '';
    }
  }
  function safeSessionSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      /* 隐私模式下忽略 */
    }
  }

  function showScreen(name) {
    if (!state.unlocked && name !== 'gate') name = 'gate';
    if (!screens[name]) return;
    Object.keys(screens).forEach((key) => screens[key].classList.remove('is-active'));
    screens[name].classList.add('is-active');
    state.currentScreen = name;
    window.scrollTo(0, 0);
    if (name === 'cover') animateCount();
  }

  function showToast(message, duration) {
    window.clearTimeout(state.toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.add('is-visible');
    state.toastTimer = window.setTimeout(() => {
      dom.toast.classList.remove('is-visible');
    }, duration || 2400);
  }

  function haptic(ms) {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(ms || 8);
      } catch (e) {
        /* 忽略 */
      }
    }
  }

  function animateCount() {
    if (state.countAnimated || !dom.coverCount) return;
    state.countAnimated = true;
    const target = 12846;
    const start = 12210;
    const started = performance.now();
    const duration = 900;
    function tick(now) {
      const p = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      dom.coverCount.textContent = Math.round(start + (target - start) * eased).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ============================================================
   * 1. 口令门
   * ============================================================ */

  function initGate() {
    $('gate-cat').innerHTML = ART.catSvg(TYPES.orange, { uid: 'gate' });
    dom.gateInput.addEventListener('input', updatePin);
    dom.gateInput.addEventListener('focus', () => {
      dom.pinField.classList.add('is-focused');
      updatePin();
    });
    dom.gateInput.addEventListener('blur', () => {
      dom.pinField.classList.remove('is-focused');
    });
    dom.pinField.addEventListener('click', () => dom.gateInput.focus());
    dom.gateForm.addEventListener('submit', submitGate);
    updatePin();
  }

  function updatePin() {
    const value = dom.gateInput.value.replace(/\D/g, '').slice(0, 4);
    dom.gateInput.value = value;
    dom.pinBoxes.forEach((box, i) => {
      box.textContent = value[i] || '';
      box.classList.toggle('is-filled', Boolean(value[i]));
      box.classList.toggle('is-current', i === value.length && value.length < 4);
    });
    dom.gateError.textContent = '';
    dom.pinField.classList.remove('is-error');
  }

  function submitGate(event) {
    event.preventDefault();
    const value = dom.gateInput.value.replace(/\D/g, '');
    if (value.length !== 4) {
      gateError('口令是 4 位数字');
      return;
    }
    if (value !== PASSCODE) {
      gateError('暗号不对，再想想');
      haptic(28);
      return;
    }
    state.unlocked = true;
    safeSessionSet(UNLOCK_KEY, '1');
    haptic(12);
    showScreen('cover');
    showToast('门开了，猫猫已就位');
  }

  function gateError(message) {
    dom.gateError.textContent = message;
    dom.pinField.classList.add('is-error');
    window.setTimeout(() => dom.pinField.classList.remove('is-error'), 440);
    dom.gateInput.focus();
    dom.gateInput.select();
  }

  /* ============================================================
   * 2. 封面
   * ============================================================ */

  function initCover() {
    $('hero-cat').innerHTML = ART.catSvg(TYPES.orange, { uid: 'hero' });
    $('btn-start').addEventListener('click', () => {
      resetQuiz();
      renderQuestion();
      showScreen('quiz');
    });
  }

  /* ============================================================
   * 3. 答题
   * ============================================================ */

  function resetQuiz() {
    state.qi = 0;
    state.answers = new Array(QS.length).fill(null);
    state.result = null;
    state.serial = '';
    state.finishing = false;
    state.posterBlob = null;
    state.posterDataUrl = '';
    state.posterFile = null;
    state.posterPromise = null;
    dom.posterImg.removeAttribute('src');
    dom.posterImg.classList.remove('is-ready');
    setPosterLoading();
    document.title = '测测你是哪种猫 · 猫格档案馆';
  }

  function renderQuestion() {
    const q = QS[state.qi];
    const selected = state.answers[state.qi];
    const total = QS.length;
    const displayNumber = String(state.qi + 1).padStart(2, '0');

    dom.quizCurrent.textContent = displayNumber;
    dom.qNumber.textContent = displayNumber;
    dom.qScene.textContent = q.scene;
    dom.qTitle.textContent = q.q;
    dom.progress.setAttribute('aria-valuemax', String(total));
    dom.progress.setAttribute('aria-valuenow', String(state.qi + 1));
    dom.progressFill.style.width = `${((state.qi + 1) / total) * 100}%`;

    dom.options.innerHTML = q.options
      .map((option, index) => {
        const isSelected = selected === index;
        return `
          <button class="option${isSelected ? ' is-selected' : ''}" type="button" role="radio" aria-checked="${isSelected}" data-index="${index}">
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span class="option-text">${option.text}</span>
            <span class="option-check" aria-hidden="true"></span>
          </button>
        `;
      })
      .join('');

    dom.options.querySelectorAll('.option').forEach((button) => {
      button.addEventListener('click', () => selectOption(Number(button.dataset.index)));
    });

    dom.btnPrev.style.display = state.qi === 0 ? 'none' : 'inline-block';
    dom.btnNext.disabled = selected == null;
    dom.btnNext.querySelector('span:first-child').textContent =
      state.qi === total - 1 ? '查看猫格' : '下一题';

    dom.quizCard.style.animation = 'none';
    void dom.quizCard.offsetHeight;
    dom.quizCard.style.animation = '';

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.requestAnimationFrame(() => {
        dom.options.querySelectorAll('.option').forEach((el, i) => {
          if (el.animate) {
            el.animate(
              [
                { opacity: 0, transform: 'translateY(7px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 320, delay: i * 45, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }
            );
          }
        });
      });
    }
  }

  function selectOption(index) {
    state.answers[state.qi] = index;
    dom.options.querySelectorAll('.option').forEach((button, i) => {
      const active = i === index;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-checked', String(active));
    });
    dom.btnNext.disabled = false;
    haptic(6);
  }

  function nextQuestion() {
    if (state.finishing || state.answers[state.qi] == null) return;
    if (state.qi === QS.length - 1) {
      state.finishing = true;
      dom.btnNext.disabled = true;
      finishQuiz();
      return;
    }
    state.qi += 1;
    renderQuestion();
  }

  function prevQuestion() {
    if (state.qi === 0) return;
    state.qi -= 1;
    renderQuestion();
  }

  function initQuiz() {
    dom.btnNext.addEventListener('click', nextQuestion);
    dom.btnPrev.addEventListener('click', prevQuestion);
    $('btn-quit').addEventListener('click', () => {
      if (state.answers.some((a) => a != null)) {
        const ok = window.confirm('答案还没保存，确定回封面吗？');
        if (!ok) return;
      }
      resetQuiz();
      showScreen('cover');
    });

    document.addEventListener('keydown', (event) => {
      if (state.currentScreen !== 'quiz') return;
      const tag = (event.target && event.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (/^[1-4]$/.test(event.key)) {
        const index = Number(event.key) - 1;
        if (index < QS[state.qi].options.length) {
          selectOption(index);
          event.preventDefault();
        }
      }
      if (event.key === 'Enter' && !dom.btnNext.disabled) {
        nextQuestion();
        event.preventDefault();
      }
    });
  }

  /* ============================================================
   * 4. 结算与结果渲染
   * ============================================================ */

  function finishQuiz() {
    state.result = SCORING.computeResult(state.answers, DATA);
    state.serial = makeSerial();
    state.posterBlob = null;
    state.posterDataUrl = '';
    state.posterFile = null;
    state.posterPromise = null;

    const allTypes = Object.keys(TYPES);
    const loadingMessages = [
      '先闻闻你的耳朵弧度',
      '正在核对肉垫温度',
      '查询你偷偷踩奶的频率',
      '把答案装进档案袋',
      '盖上猫格钢印',
    ];
    let step = 0;
    dom.loadingSub.textContent = loadingMessages[0];
    dom.loadingCat.innerHTML = ART.catSvg(TYPES[allTypes[Math.floor(Math.random() * allTypes.length)]], {
      uid: 'loading-' + Date.now(),
    });
    window.clearInterval(state.loadingTimer);
    state.loadingTimer = window.setInterval(() => {
      step = (step + 1) % loadingMessages.length;
      dom.loadingSub.textContent = loadingMessages[step];
      if (step === 2) {
        const randomType = TYPES[allTypes[Math.floor(Math.random() * allTypes.length)]];
        dom.loadingCat.innerHTML = ART.catSvg(randomType, { uid: 'loading-' + Date.now() });
      }
    }, 470);

    showScreen('loading');
    const wait = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 600 : 1850;
    window.setTimeout(() => {
      window.clearInterval(state.loadingTimer);
      renderResult();
      showScreen('result');
      window.setTimeout(() => {
        ensurePoster().catch(() => {});
      }, 350);
    }, wait);
  }

  function makeSerial() {
    let hash = 1990;
    state.answers.forEach((answer, i) => {
      hash = (hash * 31 + (answer + 1) * (i + 7) * 17) % 9000;
    });
    return String(1000 + hash);
  }

  function buildRadarSvg(scores, type) {
    const CX = 180;
    const CY = 172;
    const R = 104;
    const pointsFor = (ratio) =>
      DIMS.map((d, i) => {
        const angle = -Math.PI / 2 + (i * Math.PI) / 3;
        return [CX + Math.cos(angle) * R * ratio, CY + Math.sin(angle) * R * ratio];
      });
    const toPoints = (pts) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

    const rings = [0.33, 0.66, 1]
      .map(
        (ratio) =>
          `<polygon points="${toPoints(pointsFor(ratio))}" fill="none" stroke="rgba(45,39,35,.17)" stroke-width="1" ${
            ratio === 1 ? 'stroke-dasharray="3 4"' : ''
          }/>`
      )
      .join('');

    const axes = DIMS.map((d, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      const x = CX + Math.cos(angle) * R;
      const y = CY + Math.sin(angle) * R;
      return `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(45,39,35,.13)" stroke-width="1"/>`;
    }).join('');

    const valuePoints = DIMS.map((d, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      const value = Math.max(8, Math.min(100, scores[d.key])) / 100;
      return [CX + Math.cos(angle) * R * value, CY + Math.sin(angle) * R * value];
    });

    const labels = DIMS.map((d, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const lx = CX + cos * (R + 35);
      const ly = CY + sin * (R + 35);
      const anchor = Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end';
      const nameDy = sin > 0.5 ? 15 : sin < -0.5 ? -18 : 4;
      const scoreDy = nameDy + 16;
      return `
        <text x="${lx.toFixed(1)}" y="${(ly + nameDy).toFixed(1)}" text-anchor="${anchor}" font-family="${FONT_SANS.replace(/"/g, "'")}" font-size="12.5" font-weight="700" fill="#2D2723">${d.name}</text>
        <text x="${lx.toFixed(1)}" y="${(ly + scoreDy).toFixed(1)}" text-anchor="${anchor}" font-family="${FONT_MONO.replace(/"/g, "'")}" font-size="9.5" fill="rgba(45,39,35,.55)">${scores[d.key]}</text>
      `;
    }).join('');

    const dots = valuePoints
      .map(
        (p) =>
          `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.6" fill="${PAPER_LIGHT}" stroke="${type.deep}" stroke-width="2"/>`
      )
      .join('');

    return `
      <g>${rings}${axes}</g>
      <polygon class="radar-shape" points="${toPoints(valuePoints)}" fill="${type.color}" fill-opacity=".52" stroke="${type.deep}" stroke-width="2.6" stroke-linejoin="round"/>
      ${dots}
      <circle cx="${CX}" cy="${CY}" r="2.5" fill="${INK}" opacity=".4"/>
      ${labels}
    `;
  }

  function renderResult() {
    const result = state.result;
    const type = result.type;
    const card = dom.resultCard;

    card.style.setProperty('--cat', type.color);
    card.style.setProperty('--cat-soft', type.soft);
    card.style.setProperty('--cat-deep', type.deep);
    card.style.setProperty('--cat-eye', type.eye);

    dom.resultArt.innerHTML = ART.catSvg(type, { uid: 'result' });
    dom.matchValue.textContent = result.match;
    dom.fileNo.textContent = `NO. 1990-${state.serial}`;
    dom.resultName.textContent = type.name;
    dom.resultTitle.textContent = type.title;
    dom.resultEn.textContent = `${type.en} · ${type.code}`;
    dom.resultQuote.textContent = `「${type.quote}」`;
    dom.resultDesc.textContent = type.desc;
    dom.resultTags.innerHTML = type.tags.map((tag) => `<li>${tag}</li>`).join('');
    dom.radar.innerHTML = buildRadarSvg(result.scores, type);
    dom.loveText.textContent = type.love;
    dom.rechargeText.textContent = type.recharge;
    dom.blindText.textContent = type.blind;
    dom.rarity.textContent = type.rarity;

    dom.dimList.innerHTML = DIMS.map((d) => {
      const value = result.scores[d.key];
      const desc = value >= 68 ? d.high : value <= 34 ? d.low : '中间地带，看心情切换';
      return `
        <li class="dim-item">
          <span class="dim-name">${d.name}</span>
          <span class="dim-score">${value}</span>
          <span class="dim-track"><i data-width="${value}" style="--cat:${type.color}"></i></span>
          <span class="dim-desc">${desc}</span>
        </li>
      `;
    }).join('');

    const topShare = result.shares[0] ? result.shares[0].share : 1;
    dom.typeBars.innerHTML = result.shares
      .map((item, index) => {
        const pct = Math.max(1, Math.round(item.share * 100));
        const width = Math.max(6, Math.round((item.share / topShare) * 100));
        return `
          <div class="type-bar">
            <span class="type-rank">0${index + 1}</span>
            <span class="type-name">${item.type.name}</span>
            <span class="type-track"><i data-width="${width}" style="--bar:${item.type.color}"></i></span>
            <span class="type-value">${pct}%</span>
          </div>
        `;
      })
      .join('');

    dom.strengthList.innerHTML = type.strengths.map((item) => `<li>${item}</li>`).join('');
    dom.careList.innerHTML = type.care.map((item) => `<li>${item}</li>`).join('');

    const best = TYPES[type.best];
    const clash = TYPES[type.clash];
    dom.bestArt.innerHTML = ART.catSvg(best, { uid: 'best', decorate: false, paws: false });
    dom.clashArt.innerHTML = ART.catSvg(clash, { uid: 'clash', decorate: false, paws: false });
    dom.bestName.innerHTML = `<b>${best.name}</b><span>${best.title}</span>`;
    dom.bestWhy.textContent = type.bestWhy;
    dom.clashName.innerHTML = `<b>${clash.name}</b><span>${clash.title}</span>`;
    dom.clashWhy.textContent = type.clashWhy;

    document.title = `我是${type.name}·${type.title}｜猫格档案馆`;

    // 让进度条从 0 长出来
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.querySelectorAll('.dim-track i, .type-track i').forEach((el) => {
          el.style.width = `${el.dataset.width}%`;
        });
      });
    });
  }

  function initResult() {
    ['btn-save', 'btn-result-save'].forEach((id) => {
      const button = $(id);
      if (button) button.addEventListener('click', openPoster);
    });
    $('btn-copy').addEventListener('click', copyShareText);
    $('btn-restart').addEventListener('click', () => {
      resetQuiz();
      renderQuestion();
      showScreen('quiz');
      showToast('重新开始，这次凭第一反应');
    });
    $('btn-home').addEventListener('click', () => {
      resetQuiz();
      showScreen('cover');
    });
  }

  /* ============================================================
   * 5. 分享文案
   * ============================================================ */

  function shareText() {
    const result = state.result;
    if (!result) return '';
    const type = result.type;
    const url = location.href.split('#')[0].split('?')[0];
    return [
      `我的猫格鉴定结果：${type.name} · ${type.title}`,
      `匹配度 ${result.match}%｜「${type.quote}」`,
      `${type.tags.join(' ')}`,
      `你是哪种猫？来猫格档案馆对个暗号：${url}`,
    ].join('\n');
  }

  function copyShareText() {
    const text = shareText();
    if (!text) return;
    const done = () => showToast('文案已复制，去小红书粘贴吧');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      done();
    } catch (e) {
      showToast('复制失败，请手动选择文案');
    }
    document.body.removeChild(textarea);
  }

  /* ============================================================
   * 6. 海报生成
   * ============================================================ */

  function roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function fillRoundRect(ctx, x, y, w, h, r, fillStyle) {
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  function strokeRoundRect(ctx, x, y, w, h, r, strokeStyle, lineWidth) {
    roundRectPath(ctx, x, y, w, h, r);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function hexToRgba(hex, alpha) {
    const value = hex.replace('#', '');
    const bigint = parseInt(value.length === 3 ? value.split('').map((c) => c + c).join('') : value, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function setFont(ctx, weight, size, family) {
    ctx.font = `${weight} ${size}px ${family}`;
  }

  function drawTracking(ctx, text, x, y, tracking) {
    let cursor = x;
    Array.from(text).forEach((char) => {
      ctx.fillText(char, cursor, y);
      cursor += ctx.measureText(char).width + tracking;
    });
    return cursor - tracking;
  }

  function trackingWidth(ctx, text, tracking) {
    let width = 0;
    const chars = Array.from(text);
    chars.forEach((char, i) => {
      width += ctx.measureText(char).width + (i < chars.length - 1 ? tracking : 0);
    });
    return width;
  }

  function wrapText(ctx, text, maxWidth) {
    const chars = Array.from(text);
    const lines = [];
    let line = '';
    chars.forEach((char) => {
      const next = line + char;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const lines = wrapText(ctx, text, maxWidth);
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
      let last = visible[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
      visible[maxLines - 1] = last + '…';
    }
    visible.forEach((line, i) => {
      ctx.fillText(line, x, y + i * lineHeight);
    });
    return y + (visible.length - 1) * lineHeight;
  }

  function drawPill(ctx, text, x, y, options) {
    const fontSize = options.fontSize || 15;
    const height = options.height || 34;
    const padding = options.padding || 12;
    setFont(ctx, options.weight || 600, fontSize, FONT_SANS);
    const textWidth = ctx.measureText(text).width;
    const width = textWidth + padding * 2;
    fillRoundRect(ctx, x, y, width, height, height / 2, options.fill || PAPER_LIGHT);
    strokeRoundRect(ctx, x, y, width, height, height / 2, INK, 1.2);
    ctx.fillStyle = INK;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + padding, y + height / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';
    return width;
  }

  function drawCatImage(ctx, type, x, y, size) {
    return new Promise((resolve, reject) => {
      const svg = ART.catSvg(type, { size, uid: 'poster', decorate: true });
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        try {
          ctx.drawImage(img, x, y, size, size);
          URL.revokeObjectURL(url);
          resolve();
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('插画加载失败'));
      };
      img.src = url;
    });
  }

  function drawRadarOnCanvas(ctx, scores, type) {
    const CX = 280;
    const CY = 1200;
    const R = 128;
    const point = (i, ratio) => {
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      return [CX + Math.cos(angle) * R * ratio, CY + Math.sin(angle) * R * ratio];
    };
    const poly = (ratio) => {
      const pts = DIMS.map((d, i) => point(i, ratio));
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
      ctx.closePath();
      return pts;
    };

    // 背景网格
    [0.33, 0.66, 1].forEach((ratio, idx) => {
      poly(ratio);
      ctx.strokeStyle = idx === 2 ? 'rgba(45,39,35,.28)' : 'rgba(45,39,35,.14)';
      ctx.lineWidth = idx === 2 ? 1.5 : 1;
      if (idx === 2) ctx.setLineDash([4, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 六条轴
    DIMS.forEach((d, i) => {
      const p = point(i, 1);
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(p[0], p[1]);
      ctx.strokeStyle = 'rgba(45,39,35,.15)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    const pts = DIMS.map((d, i) => point(i, Math.max(8, Math.min(100, scores[d.key])) / 100));
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.closePath();
    ctx.fillStyle = hexToRgba(type.color, 0.55);
    ctx.fill();
    ctx.strokeStyle = type.deep;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 顶点
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 5, 0, Math.PI * 2);
      ctx.fillStyle = PAPER_LIGHT;
      ctx.fill();
      ctx.strokeStyle = type.deep;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    });

    // 轴标签
    DIMS.forEach((d, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const lx = CX + cos * (R + 40);
      const ly = CY + sin * (R + 40);
      ctx.textAlign = Math.abs(cos) < 0.25 ? 'center' : cos > 0 ? 'left' : 'right';
      ctx.fillStyle = INK;
      setFont(ctx, 700, 18, FONT_SANS);
      const nameY = ly + (sin > 0.5 ? 20 : sin < -0.5 ? -22 : 6);
      ctx.fillText(d.name, lx, nameY);
      setFont(ctx, 500, 14, FONT_MONO);
      ctx.fillStyle = 'rgba(45,39,35,.55)';
      ctx.fillText(String(scores[d.key]), lx, nameY + 21);
    });
    ctx.textAlign = 'left';
  }

  function drawPosterNoise(ctx) {
    let seed = 1990;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 420; i += 1) {
      const x = 50 + rand() * 980;
      const y = 50 + rand() * 1520;
      const r = 0.4 + rand() * 1.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(45,39,35,${0.018 + rand() * 0.035})`;
      ctx.fill();
    }
  }

  async function buildPoster() {
    if (!state.result) throw new Error('还没有结果');
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        /* 忽略字体等待失败 */
      }
    }

    const result = state.result;
    const type = result.type;
    const W = 1080;
    const H = 1620;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    drawPosterNoise(ctx);

    // 外框
    strokeRoundRect(ctx, 28, 28, 1024, 1564, 30, INK, 3);

    // 页眉
    ctx.fillStyle = INK;
    setFont(ctx, 800, 22, FONT_SANS);
    drawTracking(ctx, 'CAT ARCHIVE', 66, 90, 3.2);
    setFont(ctx, 600, 14, FONT_SERIF);
    drawTracking(ctx, '猫格档案馆', 68, 116, 5.2);
    setFont(ctx, 600, 15, FONT_MONO);
    const serialText = `NO. 1990-${state.serial}`;
    ctx.textAlign = 'right';
    ctx.fillText(serialText, 1014, 96);
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(45,39,35,.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(66, 137);
    ctx.lineTo(1014, 137);
    ctx.stroke();

    // 主视觉卡
    fillRoundRect(ctx, 64, 160, 952, 462, 30, type.soft);
    strokeRoundRect(ctx, 64, 160, 952, 462, 30, INK, 3);

    ctx.save();
    roundRectPath(ctx, 64, 160, 952, 462, 30);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(860, 352, 220, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(type.deep, 0.18);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(860, 352, 173, 0, Math.PI * 2);
    ctx.setLineDash([7, 8]);
    ctx.strokeStyle = hexToRgba(type.deep, 0.24);
    ctx.stroke();
    ctx.setLineDash([]);
    // 细网格
    ctx.strokeStyle = hexToRgba(type.deep, 0.08);
    ctx.lineWidth = 1;
    for (let x = 64; x < 1016; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 160);
      ctx.lineTo(x, 622);
      ctx.stroke();
    }
    for (let y = 160; y < 622; y += 48) {
      ctx.beginPath();
      ctx.moveTo(64, y);
      ctx.lineTo(1016, y);
      ctx.stroke();
    }
    ctx.restore();

    // 主视觉文字
    ctx.fillStyle = INK;
    setFont(ctx, 600, 15, FONT_MONO);
    drawTracking(ctx, 'YOUR CAT TYPE', 102, 210, 2.4);
    setFont(ctx, 600, 25, FONT_SANS);
    ctx.fillText('你的猫格是', 102, 261);

    const nameSize = type.name.length >= 3 ? 112 : 130;
    setFont(ctx, 900, nameSize, FONT_SANS);
    ctx.fillText(type.name, 98, 389);
    setFont(ctx, 700, 39, FONT_SERIF);
    ctx.fillStyle = type.deep;
    ctx.fillText(type.title, 103, 441);
    setFont(ctx, 600, 14, FONT_MONO);
    ctx.fillStyle = 'rgba(45,39,35,.62)';
    drawTracking(ctx, `${type.en} · ${type.code}`, 104, 474, 1.4);

    // 标签
    let tagX = 102;
    type.tags.slice(0, 3).forEach((tag) => {
      setFont(ctx, 600, 14, FONT_SANS);
      const tagWidth = ctx.measureText(tag).width + 26;
      if (tagX + tagWidth > 590) return;
      drawPill(ctx, tag, tagX, 501, { fontSize: 14, height: 34, padding: 13, fill: PAPER_LIGHT });
      tagX += tagWidth + 8;
    });

    // 猫插画
    await drawCatImage(ctx, type, 695, 162, 327);

    // 匹配度印章
    ctx.save();
    ctx.translate(930, 555);
    ctx.rotate((8 * Math.PI) / 180);
    ctx.beginPath();
    ctx.arc(0, 0, 57, 0, Math.PI * 2);
    ctx.fillStyle = PAPER_LIGHT;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(45,39,35,.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    setFont(ctx, 700, 35, FONT_MONO);
    ctx.fillText(String(result.match), 0, 8);
    setFont(ctx, 700, 12, FONT_SANS);
    ctx.fillText('% 匹配', 0, 29);
    ctx.textAlign = 'left';
    ctx.restore();

    // 引言与解读
    ctx.fillStyle = type.deep;
    setFont(ctx, 800, 82, FONT_SERIF);
    ctx.globalAlpha = 0.25;
    ctx.fillText('“', 66, 705);
    ctx.globalAlpha = 1;

    ctx.fillStyle = INK;
    setFont(ctx, 700, 35, FONT_SERIF);
    ctx.fillText(`「${type.quote}」`, 105, 708);

    ctx.fillStyle = 'rgba(45,39,35,.84)';
    setFont(ctx, 400, 23.5, FONT_SANS);
    drawWrapped(ctx, type.desc, 68, 761, 938, 41, 4);

    // 分隔线
    ctx.strokeStyle = 'rgba(45,39,35,.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(66, 928);
    ctx.lineTo(1014, 928);
    ctx.stroke();

    // 雷达区
    ctx.fillStyle = INK;
    setFont(ctx, 800, 22, FONT_SANS);
    ctx.fillText('猫格雷达', 68, 978);
    setFont(ctx, 600, 11, FONT_MONO);
    ctx.fillStyle = 'rgba(45,39,35,.45)';
    drawTracking(ctx, 'CAT SPECTRUM', 177, 976, 1.8);

    drawRadarOnCanvas(ctx, result.scores, type);

    // 中间竖线
    ctx.strokeStyle = 'rgba(45,39,35,.2)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(540, 954);
    ctx.lineTo(540, 1374);
    ctx.stroke();

    // 猫格成分
    ctx.fillStyle = INK;
    setFont(ctx, 800, 22, FONT_SANS);
    ctx.fillText('猫格成分', 574, 978);
    setFont(ctx, 600, 11, FONT_MONO);
    ctx.fillStyle = 'rgba(45,39,35,.45)';
    drawTracking(ctx, "WHAT'S INSIDE", 679, 976, 1.8);

    const topShare = result.shares[0] ? result.shares[0].share : 1;
    result.shares.forEach((item, index) => {
      const y = 1040 + index * 84;
      ctx.fillStyle = 'rgba(45,39,35,.45)';
      setFont(ctx, 600, 12, FONT_MONO);
      ctx.fillText(`0${index + 1}`, 574, y);
      ctx.fillStyle = INK;
      setFont(ctx, 700, 19, FONT_SANS);
      ctx.fillText(item.type.name, 611, y);
      const pct = Math.max(1, Math.round(item.share * 100));
      const width = Math.max(8, Math.round((item.share / topShare) * 330));
      fillRoundRect(ctx, 712, y - 15, 330, 16, 8, PAPER);
      strokeRoundRect(ctx, 712, y - 15, 330, 16, 8, INK, 1.3);
      if (width > 2) {
        fillRoundRect(ctx, 712, y - 15, width, 16, 8, item.type.color);
        strokeRoundRect(ctx, 712, y - 15, width, 16, 8, INK, 1.1);
      }
      ctx.fillStyle = INK;
      setFont(ctx, 700, 16, FONT_MONO);
      ctx.textAlign = 'right';
      ctx.fillText(`${pct}%`, 1014, y);
      ctx.textAlign = 'left';
    });

    // 成分小注
    ctx.fillStyle = 'rgba(45,39,35,.5)';
    setFont(ctx, 400, 14, FONT_SERIF);
    ctx.fillText('你身上不只有一种猫，只是这只叫得最大声。', 574, 1310);

    // 底部三栏
    ctx.strokeStyle = 'rgba(45,39,35,.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(66, 1404);
    ctx.lineTo(1014, 1404);
    ctx.stroke();

    const best = TYPES[type.best];
    const clash = TYPES[type.clash];
    const columns = [
      { x: 68, label: '最佳猫搭子', name: `${best.name} · ${best.title}`, note: type.bestWhy, width: 290 },
      { x: 390, label: '容易误伤', name: `${clash.name} · ${clash.title}`, note: type.clashWhy, width: 290 },
    ];
    columns.forEach((col) => {
      ctx.fillStyle = 'rgba(45,39,35,.48)';
      setFont(ctx, 600, 12, FONT_SANS);
      drawTracking(ctx, col.label, col.x, 1444, 2);
      ctx.fillStyle = INK;
      setFont(ctx, 700, 20, FONT_SANS);
      ctx.fillText(col.name, col.x, 1478);
      ctx.fillStyle = 'rgba(45,39,35,.6)';
      setFont(ctx, 400, 13.5, FONT_SANS);
      drawWrapped(ctx, col.note, col.x, 1505, col.width, 21, 2);
    });

    // 稀有度
    ctx.fillStyle = 'rgba(45,39,35,.48)';
    setFont(ctx, 600, 12, FONT_SANS);
    drawTracking(ctx, '稀有度', 742, 1444, 2);
    ctx.fillStyle = INK;
    setFont(ctx, 800, 38, FONT_MONO);
    ctx.fillText(type.rarity, 740, 1490);
    ctx.fillStyle = 'rgba(45,39,35,.55)';
    setFont(ctx, 400, 13, FONT_SANS);
    ctx.fillText('的两脚兽是这个猫格', 740, 1518);

    // 页脚
    ctx.strokeStyle = 'rgba(45,39,35,.22)';
    ctx.beginPath();
    ctx.moveTo(66, 1544);
    ctx.lineTo(1014, 1544);
    ctx.stroke();
    ctx.fillStyle = 'rgba(45,39,35,.55)';
    setFont(ctx, 600, 11, FONT_SANS);
    drawTracking(ctx, '猫格档案馆 · 测测你是哪种猫', 68, 1572, 1.3);
    ctx.textAlign = 'right';
    setFont(ctx, 500, 10, FONT_MONO);
    ctx.fillText('CAT ARCHIVE · FOR FUN ONLY', 1014, 1571);
    ctx.textAlign = 'left';
    ctx.strokeStyle = RED;
    ctx.lineWidth = 2;
    ctx.strokeRect(957, 1516, 55, 25);
    ctx.fillStyle = RED;
    setFont(ctx, 700, 12, FONT_SERIF);
    ctx.textAlign = 'center';
    ctx.fillText('已认领', 984.5, 1533);
    ctx.textAlign = 'left';

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('海报生成失败'));
      }, 'image/png');
    });
  }

  function setPosterLoading(message, spinner) {
    const withSpinner = spinner !== false;
    dom.posterLoading.innerHTML = `${withSpinner ? '<span></span>' : ''}${message || '正在冲印猫格档案…'}`;
    dom.posterLoading.hidden = false;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('海报读取失败'));
      reader.readAsDataURL(blob);
    });
  }

  function ensurePoster(force) {
    if (force) {
      state.posterBlob = null;
      state.posterDataUrl = '';
      state.posterFile = null;
      state.posterPromise = null;
    }
    if (state.posterBlob) return Promise.resolve(state.posterBlob);
    if (state.posterPromise) return state.posterPromise;

    state.posterPromise = buildPoster()
      .then(async (blob) => {
        state.posterBlob = blob;
        state.posterFile =
          typeof File !== 'undefined'
            ? new File([blob], `cat-archive-${state.result.type.id}-${state.serial}.png`, {
                type: 'image/png',
              })
            : null;
        // 用 data URL 而不是 blob URL 显示预览：微信里长按保存图片更稳。
        state.posterDataUrl = await blobToDataUrl(blob);
        dom.posterImg.src = state.posterDataUrl;
        dom.posterImg.alt = `我的猫格是${state.result.type.name}·${state.result.type.title}`;
        dom.posterImg.classList.add('is-ready');
        dom.posterLoading.hidden = true;
        updatePosterSaveLabel();
        return blob;
      })
      .catch((error) => {
        state.posterPromise = null;
        setPosterLoading('海报生成失败，请关闭后重试', false);
        throw error;
      });
    return state.posterPromise;
  }

  function canSharePoster() {
    if (!state.posterFile || !navigator.canShare) return false;
    try {
      return navigator.canShare({ files: [state.posterFile] });
    } catch (e) {
      return false;
    }
  }

  function updatePosterSaveLabel() {
    if (!dom.btnPosterSave) return;
    if (canSharePoster()) dom.btnPosterSave.textContent = '用系统面板保存';
    else if (isIOS() || isWeChat()) dom.btnPosterSave.textContent = '长按图片保存';
    else dom.btnPosterSave.textContent = '下载图片';
  }

  async function openPoster() {
    if (!state.result) return;
    state.lastFocus = document.activeElement;
    dom.posterModal.classList.add('is-open');
    dom.posterModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    dom.btnPosterClose.focus({ preventScroll: true });

    if (state.posterBlob) {
      dom.posterLoading.hidden = true;
      updatePosterSaveLabel();
      return;
    }
    setPosterLoading();
    try {
      await ensurePoster();
      updatePosterSaveLabel();
    } catch (e) {
      setPosterLoading('海报生成失败，请关闭后重试', false);
      showToast('海报没生成成功，再试一次');
    }
  }

  function closePoster() {
    dom.posterModal.classList.remove('is-open');
    dom.posterModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (state.lastFocus && state.lastFocus.focus) {
      state.lastFocus.focus({ preventScroll: true });
    }
  }

  function isIOS() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  function isWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent);
  }

  function downloadPoster() {
    if (!state.posterBlob) return;
    const url = URL.createObjectURL(state.posterBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cat-archive-${state.result.type.id}-${state.serial}.png`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1600);
    showToast('已开始下载，去相册或下载目录查看');
  }

  async function savePoster() {
    if (!state.posterBlob) {
      try {
        await ensurePoster();
      } catch (e) {
        showToast('海报还没准备好，请稍等');
        return;
      }
    }
    if (canSharePoster()) {
      try {
        await navigator.share({
          files: [state.posterFile],
          title: `我的猫格是${state.result.type.name}·${state.result.type.title}`,
          text: shareText(),
        });
        showToast('已打开系统面板，选择「存储图像」即可');
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') return;
        // 系统分享失败时走下面的兜底
      }
    }
    if (isIOS() || isWeChat()) {
      showToast('请长按上方图片，选择「保存图片」', 3200);
      return;
    }
    downloadPoster();
  }

  function initPoster() {
    dom.btnPosterSave.addEventListener('click', savePoster);
    dom.btnPosterClose.addEventListener('click', closePoster);
    dom.btnClosePoster.addEventListener('click', closePoster);
    document.querySelectorAll('[data-close-poster]').forEach((el) => {
      el.addEventListener('click', closePoster);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && dom.posterModal.classList.contains('is-open')) closePoster();
    });
  }

  /* ============================================================
   * 启动
   * ============================================================ */

  function init() {
    initGate();
    initCover();
    initQuiz();
    initResult();
    initPoster();

    state.unlocked = safeSessionGet(UNLOCK_KEY) === '1';
    showScreen(state.unlocked ? 'cover' : 'gate');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
