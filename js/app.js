(() => {
  'use strict';

  const QUESTION_COUNT = 10;
  const ADMIN_REFRESH_DELAY_MS = 10_000;
  const TRAITS = ['public', 'cadre', 'terrain', 'urgence', 'analyse', 'soutien', 'idee', 'vivant', 'animation'];
  const TRAIT_LABELS = {
    public: 'Sens du contact', cadre: 'Sens de l’organisation', terrain: 'Esprit pratique',
    urgence: 'Sang-froid', analyse: 'Œil précis', soutien: 'Attention aux autres',
    idee: 'Idées neuves', vivant: 'Attention au vivant', animation: 'Énergie collective'
  };
  const LOADING_MESSAGES = ['On recoupe tes réponses…', 'La commission retient son souffle…', 'Verdict prêt !'];
  const $ = selector => document.querySelector(selector);
  const screens = {
    home: $('#screen-home'), created: $('#screen-session-created'), admin: $('#screen-admin'),
    quiz: $('#screen-quiz'), loading: $('#screen-loading'), result: $('#screen-result')
  };
  const state = { questions: [], index: 0, scores: emptyScores(), locked: false, result: null, affinities: [], titleClicks: 0, session: null, admin: null, pollTimer: null, adminRequestInFlight: false };

  function emptyScores() { return Object.fromEntries(TRAITS.map(trait => [trait, 0])); }
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function selectQuestions(random = Math.random) {
    const byCategory = new Map();
    for (const question of window.QUIZ_QUESTIONS) {
      if (!byCategory.has(question.category)) byCategory.set(question.category, []);
      byCategory.get(question.category).push(question);
    }
    const pick = category => {
      const pool = byCategory.get(category);
      return pool[Math.floor(random() * pool.length)];
    };
    const middle = shuffle([...byCategory.keys()].filter(category => category !== 'depart' && category !== 'finale'), random).map(pick);
    return [pick('depart'), ...middle, pick('finale')];
  }
  function addAnswer(scores, answer) {
    for (const [trait, value] of Object.entries(answer.scores)) scores[trait] += value;
  }
  function affinityFor(scores, service) {
    const player = TRAITS.map(trait => scores[trait]);
    const profile = TRAITS.map(trait => service.profile[trait] || 0);
    const playerLength = Math.hypot(...player) || 1;
    const profileLength = Math.hypot(...profile) || 1;
    return player.reduce((sum, value, index) => sum + value * profile[index], 0) / (playerLength * profileLength);
  }
  function buildCalibration() {
    // Des parties de référence empêchent un profil généraliste de gagner par défaut.
    let seed = 2026;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const samples = 2000;
    const totals = new Map(window.QUIZ_SERVICES.map(service => [service.id, { sum: 0, squares: 0 }]));
    for (let i = 0; i < samples; i++) {
      const scores = emptyScores();
      for (const question of selectQuestions(random)) addAnswer(scores, question.answers[Math.floor(random() * 4)]);
      for (const service of window.QUIZ_SERVICES) {
        const value = affinityFor(scores, service);
        const total = totals.get(service.id);
        total.sum += value;
        total.squares += value * value;
      }
    }
    return new Map([...totals].map(([id, total]) => {
      const mean = total.sum / samples;
      const deviation = Math.sqrt(Math.max(0, total.squares / samples - mean * mean)) || 1;
      return [id, { mean, deviation }];
    }));
  }
  const CALIBRATION = buildCalibration();
  function rankServices(scores, services = window.QUIZ_SERVICES, random = Math.random) {
    return services.map(service => {
      const affinity = affinityFor(scores, service);
      const reference = CALIBRATION.get(service.id);
      return { service, affinity, score: (affinity - reference.mean) / reference.deviation, tie: random() };
    }).sort((a, b) => b.score - a.score || a.tie - b.tie);
  }
  function chooseResult(ranked, random = Math.random) {
    // Les profils proches restent en compétition : dix réponses ne justifient pas une certitude absolue.
    const temperature = 0.5;
    const best = ranked[0].score;
    const weights = ranked.map(item => Math.exp((item.score - best) / temperature));
    let draw = random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let i = 0; i < ranked.length - 1; i++) {
      if (draw < weights[i]) return ranked[i].service;
      draw -= weights[i];
    }
    return ranked.at(-1).service;
  }
  function setScreen(name) {
    if (name !== 'admin') stopAdminPolling();
    for (const [key, screen] of Object.entries(screens)) {
      screen.hidden = key !== name;
      screen.classList.toggle('screen--active', key === name);
    }
    document.body.classList.toggle('projection-view', name === 'created');
    document.body.classList.toggle('admin-view', name === 'admin');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function renderSessionQr(canvasSelector, messageSelector, code, width) {
    const canvas = $(canvasSelector);
    const message = $(messageSelector);
    canvas.hidden = true;
    message.textContent = '';
    if (!window.QRCode || !window.QRCode.toCanvas) {
      message.textContent = 'QR code indisponible. Le numéro reste utilisable.';
      return;
    }
    window.QRCode.toCanvas(canvas, window.QuizSessions.joinUrl(code), { width, margin: 2 }, error => {
      canvas.hidden = Boolean(error);
      message.textContent = error ? 'Le QR code ne peut pas être généré. Le numéro reste utilisable.' : '';
    });
  }
  function renderQuestion() {
    const question = state.questions[state.index];
    state.locked = false;
    $('#question-count').textContent = `${String(state.index + 1).padStart(2, '0')} / ${QUESTION_COUNT}`;
    $('#question-title').textContent = question.question;
    $('#progress-fill').style.width = `${state.index / QUESTION_COUNT * 100}%`;
    $('.progress-track').setAttribute('aria-valuenow', String(state.index));
    $('#between-message').textContent = '';
    const container = $('#answers');
    container.replaceChildren();
    shuffle(question.answers).forEach((answer, index) => {
      const button = document.createElement('button');
      const badge = document.createElement('span');
      const label = document.createElement('span');
      button.type = 'button';
      button.className = 'answer';
      badge.className = 'answer__index';
      badge.textContent = 'ABCD'[index];
      label.textContent = answer.text;
      button.append(badge, label);
      button.addEventListener('click', () => handleAnswer(answer, button), { once: true });
      container.append(button);
    });
    $('#question-title').focus({ preventScroll: true });
  }
  function startGame() {
    state.questions = selectQuestions();
    state.index = 0;
    state.scores = emptyScores();
    state.locked = false;
    state.result = null;
    state.affinities = [];
    $('#affinities').hidden = true;
    $('#affinity-button').setAttribute('aria-expanded', 'false');
    $('#affinity-button').textContent = 'Voir mes autres affinités ↓';
    $('#restart-button').hidden = Boolean(state.session);
    $('#session-submit-status').hidden = true;
    $('#retry-submit-button').hidden = true;
    setScreen('quiz');
    renderQuestion();
  }
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  async function handleAnswer(answer, selectedButton) {
    if (state.locked) return;
    state.locked = true;
    document.querySelectorAll('.answer').forEach(button => { button.disabled = true; });
    selectedButton.classList.add('is-selected');
    addAnswer(state.scores, answer);
    await wait(390);
    state.index++;
    if (state.index === QUESTION_COUNT) { showAnalysis(); return; }
    renderQuestion();
  }
  async function showAnalysis() {
    setScreen('loading');
    const ranked = rankServices(state.scores);
    state.affinities = ranked;
    state.result = chooseResult(ranked);
    const label = $('#loading-message');
    for (const message of LOADING_MESSAGES) {
      label.textContent = message;
      await wait(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 160 : 800);
    }
    renderResult();
    setScreen('result');
    makeConfetti();
    if (state.session) submitSessionResult();
  }
  function certificateId() {
    const year = new Date().getFullYear();
    const suffix = Math.random() < .015 ? 'CAFE' : String(Math.floor(1000 + Math.random() * 9000));
    return `SENE-${year}-${suffix}`;
  }
  function renderResult() {
    const service = state.result;
    $('#certificate-number').textContent = certificateId();
    $('#result-name').textContent = service.name;
    $('#result-description').textContent = service.description;
    $('#result-catchphrase').textContent = service.catchphrase;
    $('#result-certificate-text').textContent = service.certificateText;
    $('#certificate-date').textContent = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date());
    const strengths = Object.entries(state.scores).sort((a, b) => b[1] - a[1]).slice(0, 2);
    $('#strengths').replaceChildren(...strengths.map(([trait]) => {
      const chip = document.createElement('span');
      chip.className = 'strength-chip';
      chip.textContent = TRAIT_LABELS[trait];
      return chip;
    }));
    renderAffinities();
  }

  async function submitSessionResult() {
    const status = $('#session-submit-status');
    const retry = $('#retry-submit-button');
    status.hidden = false;
    status.textContent = 'Envoi du résultat à la session…';
    retry.hidden = true;
    try {
      await window.QuizSessions.submit(state.session.sessionId, state.session.participantToken, state.result.id);
      status.textContent = 'Résultat transmis à l’organisateur.';
    } catch (error) {
      status.textContent = error.message;
      retry.hidden = false;
    }
  }

  function showMessage(selector, message) {
    $(selector).textContent = message || '';
  }

  function stopAdminPolling() {
    if (state.pollTimer) window.clearTimeout(state.pollTimer);
    state.pollTimer = null;
  }

  function renderAdminResults(payload) {
    const region = $('#admin-results');
    const total = Number(payload.total) || 0;
    $('#admin-participant-count').textContent = String(total);
    const resultMap = new Map((payload.results || []).map(item => [item.serviceId, Number(item.count) || 0]));
    region.replaceChildren(...window.QUIZ_SERVICES.map(service => {
      const count = resultMap.get(service.id) || 0;
      const card = document.createElement('article');
      const top = document.createElement('div');
      const name = document.createElement('span');
      const value = document.createElement('strong');
      const bar = document.createElement('div');
      const fill = document.createElement('span');
      card.className = 'admin-result';
      top.className = 'admin-result__top';
      name.textContent = service.shortName;
      value.textContent = String(count);
      bar.className = 'admin-result__bar';
      fill.style.width = `${total ? Math.round(count / total * 100) : 0}%`;
      bar.append(fill);
      top.append(name, value);
      card.append(top, bar);
      return card;
    }));
    if (payload.status === 'closed') {
      $('#admin-status').textContent = 'Cette session est terminée. Le récapitulatif reste disponible pendant 30 jours.';
      $('#close-session-button').hidden = true;
    } else {
      $('#admin-status').textContent = 'Actualisation automatique toutes les 10 secondes.';
    }
  }

  async function refreshAdminResults() {
    if (!state.admin || state.adminRequestInFlight || document.visibilityState === 'hidden') return null;
    state.adminRequestInFlight = true;
    try {
      const payload = await window.QuizSessions.results(state.admin.code, state.admin.secret);
      renderAdminResults(payload);
      if (payload.status === 'closed') {
        stopAdminPolling();
        return 'closed';
      }
      return 'active';
    } catch (error) {
      $('#admin-status').textContent = error.message;
      return 'active';
    } finally {
      state.adminRequestInFlight = false;
    }
  }

  function scheduleAdminRefresh() {
    stopAdminPolling();
    if (!state.admin || document.visibilityState === 'hidden') return;
    state.pollTimer = window.setTimeout(async () => {
      state.pollTimer = null;
      if (!state.admin) return;
      if (document.visibilityState === 'hidden') return;
      const status = await refreshAdminResults();
      if (state.admin && status !== 'closed') scheduleAdminRefresh();
    }, ADMIN_REFRESH_DELAY_MS);
  }

  function openAdmin(admin, initialPayload = null) {
    stopAdminPolling();
    state.admin = admin;
    $('#admin-session-code').textContent = admin.code;
    renderSessionQr('#admin-session-qr', '#admin-qr-message', admin.code, 360);
    $('#close-session-button').hidden = false;
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('admin', admin.code);
    window.history.replaceState({}, '', url);
    setScreen('admin');
    if (initialPayload) {
      renderAdminResults(initialPayload);
      if (initialPayload.status !== 'closed') scheduleAdminRefresh();
    } else {
      refreshAdminResults().then(status => {
        if (state.admin && status !== 'closed') scheduleAdminRefresh();
      });
    }
  }

  async function createSession() {
    showMessage('#home-message', 'Création de la session…');
    $('#create-session-button').disabled = true;
    try {
      const created = await window.QuizSessions.create();
      state.admin = { code: created.code, secret: created.adminSecret };
      sessionStorage.setItem(`quiz-admin:${created.code}`, created.adminSecret);
      const createdUrl = new URL(window.location.href);
      createdUrl.search = '';
      createdUrl.searchParams.set('admin', created.code);
      window.history.replaceState({}, '', createdUrl);
      $('#created-session-code').textContent = created.code;
      $('#created-admin-secret').textContent = created.adminSecret;
      $('#created-admin-secret').closest('details').open = false;
      renderSessionQr('#session-qr-canvas', '#session-qr-message', created.code, 480);
      showMessage('#home-message', '');
      setScreen('created');
    } catch (error) {
      showMessage('#home-message', error.message);
    } finally {
      $('#create-session-button').disabled = false;
    }
  }

  async function joinSession(event) {
    event.preventDefault();
    const code = $('#join-code').value.trim();
    const submitButton = $('#join-form button[type="submit"]');
    showMessage('#join-message', 'Vérification du numéro…');
    submitButton.disabled = true;
    try {
      const joined = await window.QuizSessions.join(code);
      state.session = { code, sessionId: joined.sessionId, participantToken: joined.participantToken };
      showMessage('#join-message', 'Session rejointe. Le quiz commence !');
      startGame();
    } catch (error) {
      showMessage('#join-message', error.message);
    } finally {
      submitButton.disabled = false;
    }
  }

  async function loginAdmin(event) {
    event.preventDefault();
    const code = $('#admin-login-code').value.trim();
    const secret = $('#admin-login-secret').value.trim();
    const submitButton = $('#admin-login-form button[type="submit"]');
    showMessage('#admin-login-message', 'Vérification de la clé admin…');
    submitButton.disabled = true;
    try {
      const initialPayload = await window.QuizSessions.results(code, secret);
      sessionStorage.setItem(`quiz-admin:${code}`, secret);
      $('#admin-login-secret').value = '';
      showMessage('#admin-login-message', '');
      openAdmin({ code, secret }, initialPayload);
    } catch (error) {
      showMessage('#admin-login-message', error.message);
    } finally {
      submitButton.disabled = false;
    }
  }
  function renderAffinities() {
    const region = $('#affinities');
    const heading = document.createElement('h3');
    const list = document.createElement('div');
    heading.textContent = 'Tu aurais aussi ta place ici';
    list.className = 'affinity-list';
    state.affinities.filter(item => item.service.id !== state.result.id).slice(0, 2).forEach(item => {
      const row = document.createElement('div');
      const name = document.createElement('strong');
      row.className = 'affinity-item';
      name.textContent = item.service.name;
      row.append(name);
      list.append(row);
    });
    region.replaceChildren(heading, list);
  }
  function makeConfetti() {
    const container = $('#confetti');
    container.replaceChildren();
    for (let i = 0; i < 26; i++) {
      const piece = document.createElement('i');
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.setProperty('--drift', `${Math.round(Math.random() * 180 - 90)}px`);
      piece.style.animationDelay = `${Math.random() * .5}s`;
      container.append(piece);
    }
    window.setTimeout(() => container.replaceChildren(), 3300);
  }
  function toggleAffinities() {
    const region = $('#affinities');
    region.hidden = !region.hidden;
    $('#affinity-button').setAttribute('aria-expanded', String(!region.hidden));
    $('#affinity-button').textContent = region.hidden ? 'Voir mes autres affinités ↓' : 'Masquer mes autres affinités ↑';
  }
  function simulate(iterations = 10000, random = Math.random) {
    const count = Math.max(1, Math.floor(Number(iterations) || 1));
    const wins = new Map(window.QUIZ_SERVICES.map(service => [service.id, 0]));
    for (let game = 0; game < count; game++) {
      const scores = emptyScores();
      for (const question of selectQuestions(random)) addAnswer(scores, question.answers[Math.floor(random() * 4)]);
      const winner = chooseResult(rankServices(scores, window.QUIZ_SERVICES, random), random);
      wins.set(winner.id, wins.get(winner.id) + 1);
    }
    return window.QUIZ_SERVICES.map(service => ({ service: service.name, wins: wins.get(service.id), percent: Math.round(wins.get(service.id) / count * 10000) / 100 })).sort((a, b) => b.wins - a.wins);
  }
  function validateData() {
    if (window.QUIZ_SERVICES.length !== 18 || window.QUIZ_QUESTIONS.length < 50) throw new Error('Données du quiz incomplètes.');
    const counts = new Map();
    for (const question of window.QUIZ_QUESTIONS) {
      if (question.answers.length !== 4) throw new Error(`Quatre réponses attendues : ${question.question}`);
      counts.set(question.category, (counts.get(question.category) || 0) + 1);
      for (const answer of question.answers) for (const trait of Object.keys(answer.scores)) if (!TRAITS.includes(trait)) throw new Error(`Trait inconnu : ${trait}`);
    }
    if (counts.size !== QUESTION_COUNT || !counts.has('depart') || !counts.has('finale')) throw new Error('Dix catégories de questions attendues.');
    for (const service of window.QUIZ_SERVICES) for (const trait of Object.keys(service.profile)) if (!TRAITS.includes(trait)) throw new Error(`Trait inconnu dans ${service.name} : ${trait}`);
  }
  function bindEvents() {
    $('#start-button').addEventListener('click', () => { state.session = null; startGame(); });
    $('#restart-button').addEventListener('click', startGame);
    $('#quit-button').addEventListener('click', () => { state.session = null; setScreen('home'); });
    $('.wordmark').addEventListener('click', event => { event.preventDefault(); state.session = null; setScreen('home'); });
    $('#print-button').addEventListener('click', () => window.print());
    $('#affinity-button').addEventListener('click', toggleAffinities);
    $('#create-session-button').addEventListener('click', createSession);
    $('#show-join-button').addEventListener('click', () => {
      $('#join-form').hidden = !$('#join-form').hidden;
      if (!$('#join-form').hidden) $('#join-code').focus();
    });
    $('#join-form').addEventListener('submit', joinSession);
    $('#show-admin-login-button').addEventListener('click', () => {
      $('#admin-login-form').hidden = !$('#admin-login-form').hidden;
      if (!$('#admin-login-form').hidden) $('#admin-login-code').focus();
    });
    $('#admin-login-form').addEventListener('submit', loginAdmin);
    $('#open-admin-button').addEventListener('click', () => openAdmin(state.admin));
    document.addEventListener('visibilitychange', () => {
      if (!state.admin) return;
      if (document.visibilityState === 'hidden') {
        stopAdminPolling();
      } else {
        refreshAdminResults().then(status => {
          if (state.admin && status !== 'closed') scheduleAdminRefresh();
        });
      }
    });
    $('#close-session-button').addEventListener('click', async () => {
      if (!state.admin) return;
      $('#close-session-button').disabled = true;
      try {
        await window.QuizSessions.close(state.admin.code, state.admin.secret);
        await refreshAdminResults();
      } catch (error) {
        $('#admin-status').textContent = error.message;
      } finally {
        $('#close-session-button').disabled = false;
      }
    });
    $('#retry-submit-button').addEventListener('click', submitSessionResult);
    $('#copy-admin-secret').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText($('#created-admin-secret').textContent);
        $('#copy-admin-secret').textContent = 'CLÉ COPIÉE';
      } catch {
        $('#session-qr-message').textContent = 'Copie automatique impossible. Sélectionne la clé et copie-la manuellement.';
      }
    });
    document.querySelectorAll('[data-go-home]').forEach(button => button.addEventListener('click', () => {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url);
      state.admin = null;
      setScreen('home');
    }));
    $('#home-title').addEventListener('click', () => {
      if (++state.titleClicks === 5) $('.home__meta').textContent = 'Le comité a repéré ton sens de l’observation 👀';
    });
  }
  // Outil de développement : debugQuiz.simulate(10000)
  window.debugQuiz = Object.freeze({ simulate, selectQuestions: () => selectQuestions(), calculateResult: scores => rankServices(scores), questionCount: window.QUIZ_QUESTIONS.length, serviceCount: window.QUIZ_SERVICES.length });
  validateData();
  bindEvents();
  if (window.QuizSessions.configured) {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('session');
    const adminCode = params.get('admin');
    if (joinCode && /^\d{6}$/.test(joinCode)) {
      $('#join-form').hidden = false;
      $('#join-code').value = joinCode;
      $('#join-message').textContent = 'Numéro de session prêt à être rejoint.';
      $('#join-code').focus();
    }
    if (adminCode && /^\d{6}$/.test(adminCode)) {
      const secret = sessionStorage.getItem(`quiz-admin:${adminCode}`);
      if (secret) openAdmin({ code: adminCode, secret });
      else {
        $('#admin-login-form').hidden = false;
        $('#admin-login-code').value = adminCode;
      }
    }
  } else {
    $('#home-message').textContent = 'Les sessions partagées seront disponibles après configuration de Supabase. Le mode solo reste utilisable.';
    $('#create-session-button').disabled = true;
    $('#show-join-button').disabled = true;
    $('#show-admin-login-button').disabled = true;
  }
})();
