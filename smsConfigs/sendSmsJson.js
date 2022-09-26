const {sms_login, sms_password, sms_sender} = require('./smsConsultCreds');


var reference = { //эталонный объект
  "_declaration": {
      "_attributes": {
          "version": "1.0",
          "encoding": "utf-8"
      }
  },
  "package": {
      "_attributes": {
          "login": sms_login,
          "password": sms_password
      },
      "message": {
          "default": {
              "_attributes": {
                  "sender": sms_sender
              }
          },
          "msg": [
          ]
      }
  }
};

module.exports = reference;