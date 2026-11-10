/* The Reef · форма заявки: попап и инлайн, телефон с маской и страной по IP, проверка, отправка. */
(function () {
  'use strict';
  var C = window.REEF_CONFIG || {};
  var Reef = window.Reef || {};
  var ITI_UTILS = 'https://cdn.jsdelivr.net/npm/intl-tel-input@24.8.2/build/js/utils.js';
  var tpl = document.getElementById('lead-form-tpl');
  var modal = document.getElementById('lead-modal');
  if (!tpl || !modal) return;

  var DEFAULT_TEXT = {
    title: 'Get the presentation',
    sub: 'Prices for all 7 layouts, floor plans and the payment schedule. We\'ll reply on your preferred messenger.',
    submit: 'Get the presentation'
  };

  function contextText(form, unitId) {
    var u = unitId && Reef.unit ? Reef.unit(unitId) : null;
    if (form === 'unit' && u) return {
      title: 'Floor plan & payment schedule',
      sub: u.name + ' · ' + u.area + ' m² · ' + Reef.usd(u.price) + '. We\'ll send the floor plan, the payment schedule and the full presentation.',
      submit: 'Get floor plan & schedule'
    };
    if (form === 'payment' && u) return {
      title: 'Your payment schedule',
      sub: u.name + ': every payment until handover, plus the presentation with prices and floor plans.',
      submit: 'Get my schedule'
    };
    if (form === 'presale') return {
      title: 'Fix your unit at presale terms',
      sub: 'Presale terms run until 31 December 2026. We\'ll send the presentation and explain how the refundable $1,000 booking works.',
      submit: 'Get the presentation'
    };
    if (form === 'ownership') return {
      title: 'Get the ownership documents',
      sub: 'The ownership structure, title documents, contract terms and payment schedule, with the full presentation. A manager will walk you through them.',
      submit: 'Get the documents'
    };
    if (form === 'faq') return {
      title: 'Ask a manager',
      sub: 'We\'ll answer your questions on your preferred messenger and send the presentation.',
      submit: 'Send my question'
    };
    if (form === 'whatsapp') return {
      title: 'Talk to a manager',
      sub: 'Leave your number and we\'ll message you on WhatsApp with the presentation and prices.',
      submit: 'Message me'
    };
    return DEFAULT_TEXT;
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  /* ---------- отправка ---------- */
  function send(payload) {
    if (!C.LEAD_ENDPOINT) {
      console.info('[Reef lead · test mode, LEAD_ENDPOINT is empty]', payload);
      try { Reef.ss && Reef.ss.setItem('reef_last_' + payload.type, JSON.stringify(payload)); } catch (e) { /* ignore */ }
      return new Promise(function (res) { setTimeout(res, 500); });
    }
    var text = C.LEAD_MODE === 'text';
    return fetch(C.LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': text ? 'text/plain;charset=utf-8' : 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(function (r) {
      if (!r.ok && r.type !== 'opaque') throw new Error('HTTP ' + r.status);
      return r;
    });
  }

  /* ---------- одна форма ---------- */
  function LeadForm(slot) {
    slot.appendChild(tpl.content.cloneNode(true));
    var root = slot.querySelector('.lf');
    var form = root.querySelector('.lf__form');
    var done = root.querySelector('.lf__done');
    var qual = root.querySelector('.lf__qual');
    var uid = Math.random().toString(36).slice(2, 7);
    var self = this;
    this.root = root; this.form = form; this.ctx = { form: slot.getAttribute('data-form-slot'), unit: '' };

    // уникальные id для label/for
    ['name', 'phone', 'email'].forEach(function (k) {
      var inp = form.querySelector(k === 'phone' ? '[name=phone_input]' : '[name=' + k + ']');
      var lab = form.querySelector('[data-for=' + k + ']');
      var err = form.querySelector('[data-err=' + k + ']');
      inp.id = 'lf-' + k + '-' + uid;
      lab.setAttribute('for', inp.id);
      err.id = inp.id + '-err';
      inp.setAttribute('aria-describedby', err.id);
    });
    var titleEl = form.querySelector('[data-lf-title]');
    if (slot.getAttribute('data-form-slot') === 'modal') titleEl.id = 'modal-title';
    Reef.fillContacts && Reef.fillContacts(root);
    if (!Reef.waLink) $(done, '.lf__done > [data-contact=wa]').hidden = true;

    // телефон
    var tel = form.querySelector('[name=phone_input]');
    this.iti = null;
    if (window.intlTelInput) {
      this.iti = window.intlTelInput(tel, {
        initialCountry: 'auto',
        geoIpLookup: function (ok) {
          (Reef.geo || Promise.resolve(null)).then(function (iso) { ok(iso || C.DEFAULT_COUNTRY || 'gb'); });
        },
        separateDialCode: true,
        strictMode: true,
        countrySearch: true,
        countryOrder: C.COUNTRY_ORDER || null,
        autoPlaceholder: 'aggressive',
        validationNumberType: null,
        loadUtilsOnInit: ITI_UTILS
      });
    }

    // живая проверка после первой ошибки
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.lf__field');
      if (f && f.classList.contains('is-invalid')) self.validate(f);
    });
    tel.addEventListener('countrychange', function () {
      var f = tel.closest('.lf__field');
      if (f.classList.contains('is-invalid')) self.validate(f);
    });

    form.addEventListener('submit', function (e) { e.preventDefault(); self.submit(); });

    qual.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(qual);
      var payload = { type: 'qualification', lead_id: self.leadId, budget: fd.get('budget') || '', goal: fd.get('goal') || '', aware_2029: fd.get('aware_2029') === 'yes', created_at: new Date().toISOString() };
      send(payload).catch(function () { /* не критично */ });
      qual.hidden = true;
      root.querySelector('.lf__qual-thanks').hidden = false;
    });
    root.querySelector('[data-skip]').addEventListener('click', function () { qual.hidden = true; });

    this.done = done; this.qual = qual;
  }
  function $(root, sel) { return root.querySelector(sel); }

  LeadForm.prototype.setContext = function (formName, unitId) {
    this.ctx = { form: formName || 'modal', unit: unitId || '' };
    var t = contextText(formName, unitId);
    $(this.form, '[data-lf-title]').textContent = t.title;
    $(this.form, '[data-lf-sub]').textContent = t.sub;
    $(this.form, '.lf__submit').textContent = t.submit;
  };

  LeadForm.prototype.reset = function () {
    this.form.hidden = false;
    this.done.hidden = true;
    this.qual.hidden = false;
    this.qual.reset();
    $(this.root, '.lf__qual-thanks').hidden = true;
    $(this.form, '.lf__fail').hidden = true;
  };

  LeadForm.prototype.validate = function (field) {
    var fields = field ? [field] : Array.prototype.slice.call(this.form.querySelectorAll('.lf__field'));
    var ok = true, self = this;
    fields.forEach(function (f) {
      var bad = false;
      var name = f.querySelector('[name=name]');
      var email = f.querySelector('[name=email]');
      var tel = f.querySelector('[name=phone_input]');
      if (name) bad = name.value.trim().length < 2;
      if (email) bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      if (tel) {
        var v = self.iti && self.iti.isValidNumber();
        if (v === null || v === undefined) v = tel.value.replace(/\D/g, '').length >= 7;
        bad = !v;
      }
      f.classList.toggle('is-invalid', bad);
      var inp = name || email || tel;
      if (inp) inp.setAttribute('aria-invalid', String(bad));
      if (bad) ok = false;
    });
    return ok;
  };

  LeadForm.prototype.submit = function () {
    var self = this, form = this.form;
    var fail = $(form, '.lf__fail');
    fail.hidden = true;
    if (form.querySelector('[name=website]').value) { this.showDone('there', 'WhatsApp'); return; } // бот
    if (!this.validate()) {
      var first = form.querySelector('.is-invalid input');
      if (first) first.focus();
      return;
    }
    var fd = new FormData(form);
    var tel = form.querySelector('[name=phone_input]');
    var country = this.iti ? this.iti.getSelectedCountryData() : {};
    var phone = this.iti ? (this.iti.getNumber() || tel.value) : tel.value;
    if (phone && phone.charAt(0) !== '+' && country.dialCode) phone = '+' + country.dialCode + phone.replace(/\D/g, '');
    var u = this.ctx.unit && Reef.unit ? Reef.unit(this.ctx.unit) : null;
    this.leadId = uuid();
    var t = Reef.tracking ? Reef.tracking() : {};
    var payload = Object.assign({
      type: 'lead',
      lead_id: this.leadId,
      form_name: this.ctx.unit ? this.ctx.form + ':' + this.ctx.unit : this.ctx.form,
      unit: u ? u.id : '',
      unit_name: u ? u.name : '',
      unit_price: u ? u.price : '',
      name: String(fd.get('name') || '').trim(),
      phone: phone,
      phone_country: (country.iso2 || '').toUpperCase(),
      email: String(fd.get('email') || '').trim(),
      messenger: fd.get('messenger') || 'WhatsApp'
    }, t, {
      page_url: location.href,
      lang: 'en',
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    });

    var btn = $(form, '.lf__submit');
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    (Reef.geo || Promise.resolve(null)).then(function (iso) {
      payload.ip_country = (iso || '').toUpperCase();
      return send(payload);
    }).then(function () {
      Reef.track && Reef.track('Lead', { content_name: payload.form_name, content_category: payload.unit_name || 'presentation' }, payload.lead_id);
      self.showDone(payload.name, payload.messenger, payload.email);
    }).catch(function (err) {
      console.error('[Reef lead]', err);
      fail.hidden = false;
    }).then(function () {
      btn.disabled = false;
      btn.textContent = label;
    });
  };

  LeadForm.prototype.showDone = function (name, messenger, email) {
    var first = String(name || '').split(' ')[0];
    $(this.done, '[data-done-title]').textContent = first ? 'Thank you, ' + first : 'Thank you';
    $(this.done, '[data-done-text]').textContent = messenger === 'Call'
      ? 'A manager will call you within one business day' + (email ? ' and send the presentation to ' + email : '') + '.'
      : 'A manager will send you the presentation and your payment plan on ' + messenger + ' within one business day.';
    this.form.hidden = true;
    this.done.hidden = false;
    this.done.focus();
  };

  /* ---------- экземпляры ---------- */
  var finalSlot = document.querySelector('[data-form-slot=final]');
  var modalSlot = modal.querySelector('[data-form-slot=modal]');
  var finalForm = finalSlot ? new LeadForm(finalSlot) : null;
  if (finalForm) finalForm.setContext('final');
  var modalForm = new LeadForm(modalSlot);

  /* ---------- попап ---------- */
  var lastFocus = null;
  function openModal(formName, unitId) {
    lastFocus = document.activeElement;
    modalForm.reset();
    modalForm.setContext(formName, unitId);
    modal.hidden = false;
    document.body.classList.add('has-modal');
    var first = modal.querySelector('[name=name]');
    setTimeout(function () { if (first) first.focus({ preventScroll: true }); }, 60);
    Reef.track && Reef.track('OpenForm', { content_name: unitId ? formName + ':' + unitId : formName });
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('has-modal');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  Reef.openForm = openModal;

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open-form]');
    if (opener) {
      e.preventDefault();
      openModal(opener.getAttribute('data-form') || 'cta', opener.getAttribute('data-unit') || '');
      return;
    }
    if (e.target.closest('[data-close-modal]')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') {
      if (document.querySelector('.iti__dropdown-content:not(.iti__hide)')) return; // сначала закрывается список стран
      closeModal();
    }
    if (e.key === 'Tab') {
      var f = Array.prototype.slice.call(modal.querySelectorAll('a[href], button:not([disabled]), input:not([type=hidden]):not([tabindex="-1"]), select, [tabindex]:not([tabindex="-1"])'))
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  // ссылка вида #get_presentation открывает попап (удобно для рекламы и рассылок)
  if (/^#(get_presentation|form)$/.test(location.hash)) openModal('link');
})();
