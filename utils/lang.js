const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const backend = require('i18next-fs-backend');

i18next
    .use(backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
      backend: {
        loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json',
      },
      detection: {
        order: ['querystring', 'cookie'],
        caches: ['cookie']
      },
      fallbackLng: 'en-US',
      preload: ['en-US', 'pt-BR'],
      saveMissing: true,
    });

module.exports = i18next;

