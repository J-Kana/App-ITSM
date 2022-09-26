const db = require("../models");
const User = db.user, Registration = db.registration;
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
let template = require('../templateResponse');
const checkPhoneNumber = require("../middleware/check_phone_number");
const xmlJs = require('xml-js');
const axios = require('axios');
const sendSmsJson = require('../smsConfigs/sendSmsJson');
const response_codes = require('../smsConfigs/smsConsultResponseCodes');
const HTTP_CONFIGS = require('../smsConfigs/http');
const smsConfig = require('../smsConfigs/smsConfig');
const config = require('../config');

exports.signin = (req, res) => {
    User.findOne({ where: { phone: req.body.phone } })
        .then(user => {
            if (!user) {
                return  template(401, "Неправильный номер телефона и/или пароль!",[],true, res)
            }

            var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
            if (!passwordIsValid) return template(401, "Неправильный номер телефона и/или пароль!", [], true, res)

            var token = jwt.sign({ id: user.id }, config.key, {
                expiresIn: 86400 // 24 hours
            });
            delete user.dataValues.password
            template(200, "", { accessToken: token, user }, false, res)
        })
        .catch(err => { template(500, err.message , [], false, res) });
};

exports.signup = (req, res) => {
    try {
        let {body} = req
        // **************     То что отправляется на бд       **************
        // body = {
        //     name: 'Clark',
        //     surname: 'Kent',
        //     patronymic: '',
        //     phone: '77020007696',
        //     supervisor_fullname: 'Clark Joseph Kent',
        //     supervisor_phone: '77012223344',
        //     smsCode: ''
        // }

        // **************     То что отправляется на смс сервис       **************
        // body = {
        //     phone: '77020007696',
        //     action: 'signup',
        //     type: 'phone_number'
        // }

        var options = { //опции для конвертирования json <--> xml
            compact: true,
            ignoreComment: true,
            spaces: 4
        };

        // let sms_code =  Math.random().toString(36).substring(2, 15);
        let sms_code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
        var data = { phone_number: body.phone, action: 'signup', random_code: sms_code }
        // var type = body.type;
        var type = 'phone_number';

        var phone_number = onlyNumbers(data.phone_number);
        var smsBody = smsBodyFunc(data);
        data.smsBody = smsBody;
        var sendSmsJsonClone = JSON.parse(JSON.stringify(sendSmsJson)); //клонируем объект чтобы не ссылался на эталонный
        var object_to_push = {};
        object_to_push['_attributes'] = {};
        object_to_push['_attributes']['recipient'] = phone_number;
        object_to_push['_attributes']['priority'] = "high";
        object_to_push['_text'] = smsBody;
        sendSmsJsonClone['package']['message']['msg'].push(object_to_push);
        Registration.create(body)
            .then(async obj => {
                var _id = obj.id;
                var config = {
                    headers: {
                        'content-type': 'text/xml;charset=UTF-8'
                    }
                };
                var xmlBodyStr = xmlJs.json2xml(sendSmsJsonClone, options);
                try {
                    // Сервис отправки смс сообщения
                    var response = await axios.post('http://service.sms-consult.kz/', xmlBodyStr, config);
                    if (response.status = 200) { //post запрос завершился успешно
                        //console.log('type: ',type);
                        if(type == 'phone_number') {
                            var param_phone = formatPhoneNumber(phone_number)
                        }
                        else {
                            var param_phone = hideFormattedPhoneNumber(formatPhoneNumber(phone_number))
                        }
                        var response2 = await axios.get(HTTP_CONFIGS.I18N_SERVICE_URL, {
                            data: [{code : 'smsSuccess', params: {par_1: param_phone}}]
                        });

                        await Registration.update({smsCode: data.random_code}, {where: {id: _id}});
                        response2.data[0].message.id =
                        template(200, "", response2.data[0].message, true, res);
                    }
                    else template(400, response, [], true, res)
                }
                catch (e) { template(500, e, [], true, res) }
            })
            .catch(err => { template(403, err.message, [], false, res) })

        function onlyNumbers (param) {
            var notDigitRegExp = /\D+/g;
            return param.replace( notDigitRegExp, "");
        }

        function smsBodyFunc(data) {
            var random_code = data.random_code;
            var app_id = '2T/TQ48VlsP';
            var action = data.action;
            if(action == 'signup') {
                // return 'Ваш код для регистрации: ' + random_code + ' '+ app_id
                return 'Код для регистрации в системе: ' + random_code
            }
            else if(action == 'resetPassword') {
                return 'Код для восстановления пароля: '+ random_code + ' '+ app_id
            }
            else if(action == undefined) {
                return 'Отсутствует вид запроса в смс сервисе!'
            }
            else {
                return 'Никому не говорите код: '+ random_code + ' '+ app_id
            }
        }

        function formatPhoneNumber(phoneNumberString) {// 87772223344 =>> +7 (777) 222-3344
            var cleaned = ('' + phoneNumberString).replace(/\D/g, '')
            var match = cleaned.match(/^(7|8)?(\d{3})(\d{3})(\d{2})(\d{2})$/)
              //console.log(match)
            if (match) {
                var intlCode = (match[1] ? '+7 ' : '')
                return [intlCode, '(', match[2], ') ', match[3], '-', match[4], '-', match[5]].join('')
            }
            return null
        }

        function hideFormattedPhoneNumber(phone_number) {// +7 (777) 222-3344 =>> "+7 (777) ***-**44"
            return phone_number.substring(0, 8) + ' ***-**' + phone_number.substring(15, phone_number.length)
        }
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.signup_v2 = (req, res) => {
    try {
        let {body} = req
        var options = { //опции для конвертирования json <--> xml
            compact: true,
            ignoreComment: true,
            spaces: 4
        };

        // let sms_code =  Math.random().toString(36).substring(2, 15);
        let sms_code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
        var data = { phone_number: body.phone, action: 'signup', random_code: sms_code }
        // var type = body.type;
        var type = 'phone_number';

        var phone_number = onlyNumbers(data.phone_number);
        var smsBody = smsBodyFunc(data);
        data.smsBody = smsBody;
        var sendSmsJsonClone = JSON.parse(JSON.stringify(sendSmsJson)); //клонируем объект чтобы не ссылался на эталонный
        var object_to_push = {};
        object_to_push['_attributes'] = {};
        object_to_push['_attributes']['recipient'] = phone_number;
        object_to_push['_attributes']['priority'] = "high";
        object_to_push['_text'] = smsBody;
        sendSmsJsonClone['package']['message']['msg'].push(object_to_push);

        let phoneNumber = checkPhoneNumber(body.phone);
        if(phoneNumber.status == 200) {
            body.phone = phoneNumber.data;
            createRegistration(body);
        }
        else {
            template(403, "Неправильно введен номер телефона!", [], false, res);
        }

        function createRegistration(body) {
            Registration.create(body)
                .then(async obj => {
                    if(!obj) template(502, "Ошибка регистрации объекта!", [], false, res);
                    else {
                        var _id = obj.id;
                        let checkIIN = await User.findOne({where: {IIN: body.IIN}});
                        if(checkIIN) {
                            await Registration.update({response: "Пользователь с указанным ИИН уже существует"}, {where: {id: _id}})
                            template(403, "Пользователь с указанным ИИН уже существует", [], false, res);
                        }
                        else {
                            let checkPhone = await User.findOne({where: {phone: body.phone}});
                            if(checkPhone) {
                                await Registration.update({response: "Пользователь с указанным номером телефона уже существует"}, {where: {id: _id}})
                                template(403, "Пользователь с указанным номером телефона уже существует", [], false, res);
                            }
                            else {
                                var config = {
                                    headers: {
                                        'content-type': 'text/xml;charset=UTF-8'
                                    }
                                };
                                var xmlBodyStr = xmlJs.json2xml(sendSmsJsonClone, options);
                                try {
                                    // Сервис отправки смс сообщения
                                    var response = await axios.post('http://service.sms-consult.kz/', xmlBodyStr, config);
                                    if (response.status = 200) { //post запрос завершился успешно
                                        //console.log('type: ',type);
                                        if(type == 'phone_number') {
                                            var param_phone = formatPhoneNumber(phone_number)
                                        }
                                        else {
                                            var param_phone = hideFormattedPhoneNumber(formatPhoneNumber(phone_number))
                                        }
                                        var response2 = await axios.get(HTTP_CONFIGS.I18N_SERVICE_URL, {
                                            data: [{code : 'smsSuccess', params: {par_1: param_phone}}]
                                        });

                                        await Registration.update({smsCode: data.random_code}, {where: {id: _id}});
                                        response2.data[0].message.id = _id
                                        template(200, "", response2.data[0].message, true, res);
                                    }
                                    else template(400, response, [], true, res)
                                }
                                catch (e) { template(500, e, [], true, res) }
                            }
                        }
                    }
                })
                .catch(err => { template(403, err.message, [], false, res) })
        }

        function onlyNumbers (param) {
            var notDigitRegExp = /\D+/g;
            return param.replace( notDigitRegExp, "");
        }

        function smsBodyFunc(data) {
            var random_code = data.random_code;
            var app_id = '2T/TQ48VlsP';
            var action = data.action;
            if(action == 'signup') {
                // return 'Ваш код для регистрации: ' + random_code + ' '+ app_id
                return 'Код для регистрации в системе: ' + random_code
            }
            else if(action == 'resetPassword') {
                return 'Код для восстановления пароля: '+ random_code
            }
            else if(action == undefined) {
                return 'Отсутствует вид запроса в смс сервисе!'
            }
            else {
                return 'Никому не говорите код: '+ random_code
            }
        }

        function formatPhoneNumber(phoneNumberString) {// 87772223344 =>> +7 (777) 222-3344
            var cleaned = ('' + phoneNumberString).replace(/\D/g, '')
            var match = cleaned.match(/^(7|8)?(\d{3})(\d{3})(\d{2})(\d{2})$/)
              //console.log(match)
            if (match) {
                var intlCode = (match[1] ? '+7 ' : '')
                return [intlCode, '(', match[2], ') ', match[3], '-', match[4], '-', match[5]].join('')
            }
            return null
        }

        function hideFormattedPhoneNumber(phone_number) {// +7 (777) 222-3344 =>> "+7 (777) ***-**44"
            return phone_number.substring(0, 8) + ' ***-**' + phone_number.substring(15, phone_number.length)
        }
    }
    catch(e) { template(500, e.message, [], true, res) }
};