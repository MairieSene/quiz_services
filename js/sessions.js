(() => {
  'use strict';

  const config = window.SUPABASE_CONFIG || {};
  const configured = Boolean(config.url && config.publishableKey);
  const apiBase = configured ? `${config.url.replace(/\/$/, '')}/functions/v1` : '';

  async function call(name, body) {
    if (!configured) throw new Error('Supabase n’est pas encore configuré. Ajoute l’URL du projet et la clé publishable dans js/supabase-config.js.');
    let response;
    try {
      response = await fetch(`${apiBase}/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.publishableKey,
          Authorization: `Bearer ${config.publishableKey}`
        },
        body: JSON.stringify(body)
      });
    } catch {
      throw new Error('Connexion impossible. Vérifie ta connexion internet puis réessaie.');
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'La demande n’a pas abouti. Réessaie dans un instant.');
    return payload;
  }

  function joinUrl(code) {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('session', code);
    return url.toString();
  }

  window.QuizSessions = Object.freeze({
    configured,
    create: () => call('create-session', {}),
    join: code => call('join-session', { code }),
    submit: (sessionId, participantToken, serviceId) => call('submit-result', { sessionId, participantToken, serviceId }),
    results: (code, adminSecret) => call('admin-results', { code, adminSecret }),
    close: (code, adminSecret) => call('close-session', { code, adminSecret }),
    joinUrl
  });
})();
