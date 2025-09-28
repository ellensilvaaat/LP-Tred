(() => {
  'use strict';

  /* ====== CONFIG ====== */
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwDiYr4WUX3rex6wJaCyTRbFWxmJdSDSDyjLLUg_DiCfSidShM_rXKJn9CrPbaGT3Da/exec';
  const SECRET      = 'tred_prod_9a1f2e7b3c8d4f6a0b5c2e9d7a1f3b5';

  /* ====== REGEX EMAIL ====== */
  const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  /* ====== FORM ====== */
  const form = document.getElementById('lead_form');
  const messageEl = document.getElementById('form_message');
  const setMsg = (t, ok=true)=>{ if(messageEl){ messageEl.textContent=t||''; messageEl.style.color = ok?'#2f855a':'#c53030'; }};

  // Desliga o tooltip nativo do navegador
  form?.setAttribute('novalidate','');

  // ===== Modal helpers =====
  const modal     = document.getElementById('success_modal');
  const modalText = modal?.querySelector('.modal__text');
  let lastFocus;
  function openModal(text='Thanks! You are on the list. 🎉'){
    if(!modal) return;
    if (text) modalText.textContent = text;
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('[data-close]')?.focus();
  }
  function closeModal(){
    if(!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    lastFocus?.focus();
  }
  modal?.addEventListener('click', e => { if(e.target === modal) closeModal(); });
  modal?.querySelectorAll('[data-close]')?.forEach(btn => btn.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal(); });

  // ===== Envio URL-encoded, sem headers (evita CORS/preflight) =====
  const sendLead = async (payload) => {
    const body = new URLSearchParams(payload);
    await fetch(WEB_APP_URL, { method:'POST', mode:'no-cors', body });
    return { ok:true }; // resposta opaque
  };

  if(!form) return;

  const emailInput = form.querySelector('input[name="email"]');
  const nameInput  = form.querySelector('input[name="name"]');

  // Cria o elemento de erro (sem precisar mexer no HTML)
  const emailError = (() => {
    if (!emailInput) return null;
    const span = document.createElement('span');
    span.id = 'email_error';
    span.className = 'error-message';
    span.setAttribute('aria-live','polite');
    emailInput.insertAdjacentElement('afterend', span);
    return span;
  })();

  // Helpers de erro do email (borda vermelha via aria-invalid)
  function showEmailError(msg){
    if (emailError) emailError.textContent = msg || 'Enter a valid email.';
    emailInput?.setAttribute('aria-invalid','true');
  }
  function clearEmailError(){
    if (emailError) emailError.textContent = '';
    emailInput?.removeAttribute('aria-invalid');
  }

  // feedback em tempo real (email)
  emailInput?.addEventListener('input', () => {
    const v = emailInput.value.trim();
    if (!v)          { showEmailError('Email is required.'); return; }
    if (!EMAIL_RE.test(v)) { showEmailError('Enter a valid email.'); return; }
    clearEmailError();
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const hp = form.querySelector('input[name="company"]'); // honeypot opcional
    if (hp && hp.value.trim() !== '') return;

    const name  = nameInput?.value.trim();
    const email = emailInput?.value.trim();
    const btn   = form.querySelector('button[type="submit"]');

    // valida SOMENTE e-mail (sem tooltip nativo)
    if (!EMAIL_RE.test(email || '')) {
      showEmailError(email?.length ? 'Enter a valid email.' : 'Email is required.');
      emailInput?.focus();
      return;
    }
    clearEmailError();

    const oldText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

    const payload = {
      secret: SECRET,
      name,
      email,
      page: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      const result = await sendLead(payload);
      if (result?.ok) {
        openModal('Thanks! You are on the list. 🎉');
        form.reset();
      } else {
        setMsg('Something went wrong. Try again.', false);
      }
    } catch {
      setMsg('Network error. Please try again.', false);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = oldText; }
    }
  }, true);
})();





