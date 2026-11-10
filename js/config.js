/* Настройки лендинга The Reef. Всё, что меняется без правки вёрстки, — здесь. */
window.REEF_CONFIG = {
  // Куда отправлять заявки. Пусто = тестовый режим: заявка пишется в консоль браузера, форма показывает успех.
  LEAD_ENDPOINT: '',
  // 'json' — POST application/json (CRM, Make, n8n); 'text' — тот же JSON как text/plain (Google Apps Script без CORS-префлайта).
  LEAD_MODE: 'json',

  // Meta Pixel. Пусто = пиксель и баннер cookies не загружаются.
  PIXEL_ID: '',

  // Контакты [CONFIRM у клиента]. Пустые значения скрываются; кнопки WhatsApp тогда открывают форму.
  PHONE: '',              // '+255 700 000 000'
  EMAIL: '',              // 'sales@…'
  WHATSAPP: '',           // только цифры: '255700000000'
  TELEGRAM: '',           // username без @
  WHATSAPP_TEXT: 'Hello! I would like the presentation and payment plan for The Reef Residence.',

  // Ссылка на прогресс стройки [CONFIRM]. Пусто = кнопка скрыта.
  CONSTRUCTION_URL: '',
  PRIVACY_URL: '#privacy',

  // Конец пресейла: 31.12.2026 23:59:59 по Занзибару (UTC+3)
  PRESALE_DEADLINE: '2026-12-31T23:59:59+03:00',

  // Страна телефона, если по IP определить не удалось
  DEFAULT_COUNTRY: 'gb',
  COUNTRY_ORDER: ['gb', 'de', 'it', 'pl', 'za', 'ae', 'us', 'fr', 'nl', 'ke'],

  // Юниты и цены (из файла смыслов, график платежей)
  UNITS: [
    { id: 'mini_studio',   name: 'Mini Studio',                  area: 21.6, price: 79920 },
    { id: 'standard_studio', name: 'Standard Studio',            area: 26.3, price: 97310 },
    { id: 'studio_panoramic', name: 'Standard Studio Panoramic', area: 32.2, price: 114310 },
    { id: 'studio_plus',   name: 'Studio +',                     area: 36.3, price: 128865 },
    { id: 'one_bedroom',   name: '1 Bedroom Apartment',          area: 45.5, price: 158113 },
    { id: 'two_bedroom',   name: '2 Bedroom Apartment Panoramic', area: 62.4, price: 222768 },
    { id: 'three_bedroom', name: '3 Bedroom Apartment Panoramic', area: 75.3, price: 256020 }
  ],

  // График: бронь, 2 взноса по 10%, затем 8 квартальных по 10%
  BOOKING: 1000,
  SCHEDULE: [
    { when: 'By end of February 2027', share: 0.10, note: 'Your $1,000 booking counts towards it' },
    { when: 'By 1 September 2027',     share: 0.10 },
    { when: 'October 2027',  share: 0.10, q: true },
    { when: 'January 2028',  share: 0.10, q: true },
    { when: 'April 2028',    share: 0.10, q: true },
    { when: 'July 2028',     share: 0.10, q: true },
    { when: 'October 2028',  share: 0.10, q: true },
    { when: 'January 2029',  share: 0.10, q: true },
    { when: 'April 2029',    share: 0.10, q: true },
    { when: 'July 2029',     share: 0.10, q: true }
  ]
};
