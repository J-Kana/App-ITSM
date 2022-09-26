var {domain} = require('./environment');


module.exports = {
  "I18N_SERVICE_URL": domain+"i18n/dynamicMessages/getMessageWithParams",
  "invalidateUserSessionData": domain+"auth/invalidateUserSessionData"
};