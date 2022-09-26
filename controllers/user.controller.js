const db = require("../models");
const template = require("../templateResponse");
const checkPhoneNumber = require("../middleware/check_phone_number");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Op = require('sequelize').Op;
const xmlJs = require('xml-js');
const axios = require('axios');
const sendSmsJson = require('../smsConfigs/sendSmsJson');
const response_codes = require('../smsConfigs/smsConsultResponseCodes');
const HTTP_CONFIGS = require('../smsConfigs/http');
const smsConfig = require('../smsConfigs/smsConfig');
const User = db.user, Role = db.role, Registration = db.registration, PwdRstRqt = db.pwdRstRqt;
const config = require('../config');
const {createCustomer, addCustomer, getOrganizationCustomers, getJiraCustomer } = require('./customer.controller');

exports.getObject = (req, res) => {
    try {
        let {id} = req.params
        if(!id) {
            User.findAll()
                .then(async users => {
                    if(users.length === 0) template(200, "", [], true, res)
                    else {
                        let userArr = []
                        for(let user of users) {
                            try {
                                delete user.dataValues.password
                                user.dataValues.roleId = await Role.findByPk(user.dataValues.roleId)
                                userArr.push(user.dataValues)
                            }
                            catch(e) { template(500, e.message, [], true, res) }
                        }
                        template(200, "", userArr, true, res)
                    }
                })
                .catch(err => template(500, err.message, [], true, res));
        }
        else {
            User.findOne({where: {id: id}})
                .then(async user => {
                    if(!user) template(404, "Пользователь не найден!", [], true, res)
                    try {
                        delete user.dataValues.password
                        user.dataValues.roleId = await Role.findByPk(user.dataValues.roleId)
                        template(200, "", user, true, res)
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                })
                .catch(err => template(500, err.message, [], true, res));
        }
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.objectCreate = (req, res) => {
    try {
        let token = req.headers["x-access-token"];
        let {body} = req
        if(!token) return template(401, "Токен не предоставлен!", [],false, res)

        jwt.verify(token, config.key, (err, decoded) => {
            if(err) return template(401, "Неавторизованный!", [],false, res)
            User.findByPk(decoded.id)
                .then(async obj => {
                    if(!obj) template(404, "Пользователь не найден!", [], true, res)
                    try {
                        if (obj.roleId === 2) {
                            if (body.roleId === 3) {
                                template(403, "Требуемая роль администратора", [], true, res)
                            }
                            else {
                                body.password = bcrypt.hashSync(body.password, 8)
                                body.roleId = body.roleId !== undefined ? body.roleId: 1
                                User.create(body).then(user => {
                                    if(user) template(200, "Пользователь успешно зарегистрирован",[],false, res)
                                    else template(500, "",[],false, res)
                                }).catch(err => { template(500, err.message,[],false, res) });
                            }
                        }
                        else {
                            body.password = bcrypt.hashSync(body.password, 8)
                            body.roleId = body.roleId !== undefined ? body.roleId: 1
                            User.create(body).then(user => {
                                if(user) template(200, "Пользователь успешно зарегистрирован",[],false, res)
                                else template(500, "",[],false, res)
                            }).catch(err => {template(500, err.message,[],false, res)});
                        }
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                })
                .catch(err => template(500, err.message, [], true, res));
        })
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.objectUpdate = (req, res) => {
    try {
        let token = req.headers["x-access-token"];
        let {id} = req.params
        let {body} = req
        if(!token) return template(401, "Токен не предоставлен!", [], false, res)

        jwt.verify(token, config.key, (err, decoded) => {
            if(err) return template(401, "Неавторизованный!", [],false, res)
            User.findByPk(decoded.id)
                .then(async obj => {
                    if(!obj) template(404, "Пользователь не найден!", [], true, res)
                    try {
                        if(obj.roleId === 2) {
                            User.findByPk(id)
                                .then(async user => {
                                    if(user.roleId === 3) {
                                        template(403, "Требуемая роль администратора", [], true, res)
                                    }
                                    else {
                                        try {
                                            if(body.email !== user.dataValues.email && body.email !== "" && body.email !== undefined && body.email !== null) {
                                                let DBemail = await User.findAll({where: {email: body.email}})
                                                if(DBemail.length > 0) {
                                                    template(409, "Эл. адрес уже существует", [], true, res)
                                                    return false;
                                                }
                                            }
                                            if(body.password !== user.dataValues.password && body.password !== "" && body.password !== undefined && body.password !== null) {
                                            // if(body.oldpassword && body.password) {
                                                let passwordIsValid = bcrypt.compareSync(body.oldpassword, user.password);
                                                if(passwordIsValid) body.password = bcrypt.hashSync(body.password, 8)
                                                else {
                                                    template(400, "Неверный старый пароль!", [], true, res)
                                                    return false
                                                }
                                                User.update(body, {where: {id: id}})
                                                    .then(async (response) => {
                                                        if (response[0]) template(200, "Объект успешно обновлен", [], true, res)
                                                    })
                                                    .catch(e => {template(500, e.message, [], true, res)});
                                            }
                                            else {
                                                delete body.password
                                                User.update(body, {where: {id: id}})
                                                    .then(async (response) => {
                                                        if (response[0]) template(200, "Объект успешно обновлен", [], true, res)
                                                    })
                                                    .catch(e => {template(500, e.message, [], true, res)});
                                            }
                                        }
                                        catch(e) { template(500, e.message, [], true, res) }
                                    }
                                }).catch(err => template(500, err.message, [], true, res));
                        }
                        else {
                            User.findByPk(id)
                                .then(async user => {
                                    try {
                                        if(body.email !== user.dataValues.email && body.email !== "" && body.email !== undefined && body.email !== null) {
                                            let emailDatabase = await User.findAll({where: {email: body.email}})
                                            if (emailDatabase.length > 0) {
                                                template(409, "Эл. адрес уже существует", [], true, res)
                                                return false;
                                            }
                                        }
                                        if(body.password !== user.dataValues.password && body.password !== "" && body.password !== undefined && body.password !== null) {
                                        // if(body.oldpassword && body.password) {
                                            let passwordIsValid = bcrypt.compareSync(body.oldpassword, user.password);
                                            if (passwordIsValid) body.password = bcrypt.hashSync(body.password, 8)
                                            else {
                                                template(400, "Неверный старый пароль", [], true, res)
                                                return false
                                            }
                                            User.update(body, {where: {id: id}})
                                                .then(async (response) => {
                                                    if (response[0]) template(200, "Объект успешно обновлен", [], true, res)
                                                })
                                                .catch(e => {template(500, e.message, [], true, res)});
                                        }
                                        else {
                                            delete body.password
                                            User.update(body, {where: {id: id}})
                                                .then(async (response) => {
                                                    if (response[0]) template(200, "Объект успешно обновлен", [], true, res)
                                                })
                                                .catch(e => {template(500, e.message, [], true, res)});
                                        }
                                    }
                                    catch(e) { template(500, e.message, [], true, res) }
                                }).catch(err => template(500, err.message, [], true, res));
                        }
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => template(500, err.message, [], true, res));
        })
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.objectDelete = (req, res) => {
    try {
        let token = req.headers["x-access-token"];
        let {id} = req.params
        if (!token) return template(401, "Токен не предоставлен!", [], false, res)

        jwt.verify(token, config.key, (err, decoded) => {
            if (err) return template(401, "Неавторизованный!", [], false, res)
            User.findByPk(decoded.id)
                .then(async user => {
                    if (!user) template(404, "Пользователь не найден", [], true, res)
                    try {
                        if(user.roleId === 3) {
                            User.destroy({where: {id: id}})
                                .then((response) => {
                                    if (response === 1) template(200, "Пользователь был удален", [], true, res)
                                    else template(404, "Пользователь не найден", [], true, res)
                                }).catch(e => {template(500, e.message, [], true, res)});
                        }
                        else {
                            User.findByPk(id).then(
                                async object => {
                                    if(object.roleId === 3) {
                                        template(403, "Требуемая роль администратора", [], true, res)
                                    }
                                    else {
                                        User.destroy({where: {id: id}})
                                            .then((response) => {
                                                if (response === 1) template(200, "Пользователь был удален", [], true, res)
                                                else template(404, "Пользователь не найден", [], true, res)
                                            }).catch(e => {template(500, e.message, [], true, res)});
                                    }
                                }).catch(e => {template(500, e.message, [], true, res)});
                        }
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => template(500, err.message, [], true, res));
        });
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.registerObject = async (req, res) => {
    try {
        let {body} = req;
        // body = {
        //     id: 1,
        //     password: '123',
        //     sms_code: '321'
        // }
        Registration.findOne({where: {id: body.id}})
            .then(async obj => {
                if(!obj) template(404, "Объект не найден!", [], true, res)
                else {
                    if(body.sms_code == obj.smsCode) {
                        body.password = bcrypt.hashSync(body.password, 8)
                        body.roleId = body.roleId !== undefined ? body.roleId: 1

                        let customerName = `${obj.surname} ${obj.name} (${obj.phone})`;
                        let customerEmail = `itsm-${obj.IIN}@m-lombard.kz`;
                        let customerID = await createCustomer(customerName, customerEmail);
                        if(customerID.status == 200) {
                            let customerResult = await addCustomer(customerID.data.accountId);
                            if(customerResult.status == 200) {
                                let userObject = {
                                    name: obj.name,
                                    surname: obj.surname,
                                    patronymic: obj.patronymic,
                                    password: body.password,
                                    phone: obj.phone,
                                    IIN: obj.IIN,
                                    supervisor_fullname: obj.supervisor_fullname,
                                    supervisor_phone: obj.supervisor_phone,
                                    jiraAccountId: customerID.data.accountId,
                                    roleId: body.roleId
                                }
                                await User.create(userObject)
                                    .then(async user => {
                                        if(user) {
                                            try {
                                                var token = jwt.sign({ id: user.id }, config.key, {
                                                    expiresIn: 86400 // 24 hours
                                                });
                                                await User.update({passwordTime: user.createdAt}, {where: {id: user.id}})
                                                await Registration.update({userID: user.id}, {where: {id: body.id}})
                                                    .then(object => {
                                                        if(object) template(200, "Пользователь успешно зарегистрирован", token, true, res);
                                                        else template(400, "Пользователь зарегистрирован, но возникла ошибка при обновлении таблицы 'регистрации'", token, true, res);
                                                    })
                                                    .catch(err => { template(500, err.message, [], false, res) })
                                            }
                                            catch(e) { template(501, e.message, [], true, res) }
                                        }
                                        else template(400, "Не удалось зарегистрировать пользователя!", [], true, res);
                                    })
                                    .catch(err => { template(500, err.message, [], true, res) });
                                template(200, "Пользователь успешно зарегистрирован", token, true, res);
                            }
                            else template(504, "", customerResult.data, true, res);
                        }
                        else template(503, "", customerID.data, true, res);
                    }
                    else template(403, "Введен неверный код из SMS", [], false, res);
                }
            })
            .catch(err => { template(500, err.message, [], true, res) });
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.getJiraCustomers = async (req, res) => {
    try {
        let result = await getJiraCustomer()
        template(200, "", result, true, res);
    }
    catch(e) { template(500, e.message, [], true, res) }
}

exports.getCustomers = async (req, res) => {
    try {
        let result = await getOrganizationCustomers();
        template(200, "", result, true, res);
    }
    catch(e) { template(500, e.message, [], true, res) }
}

exports.resetPassword_smsCode = (req, res) => {
    try {
        let {body} = req
        var options = { //опции для конвертирования json <--> xml
            compact: true,
            ignoreComment: true,
            spaces: 4
        };

        let sms_code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
        var data = { phone_number: body.phone, action: 'resetPassword', random_code: sms_code }
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
            updateUser(body);
        }
        else {
            template(403, "Неправильно введен номер телефона!", [], false, res);
        }
        
        function updateUser(body) {
            User.findOne({where: {phone: body.phone}})
                .then(async user => {
                    if(!user) template(404, "Пользователь с указанным номером не зарегистрирован в системе", [], false, res);
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
                                if(type == 'phone_number') {
                                    var param_phone = formatPhoneNumber(phone_number)
                                }
                                else {
                                    var param_phone = hideFormattedPhoneNumber(formatPhoneNumber(phone_number))
                                }
                                var response2 = await axios.get(HTTP_CONFIGS.I18N_SERVICE_URL, {
                                    data: [{code : 'smsSuccess', params: {par_1: param_phone}}]
                                });
                
                                await User.update({password_smsCode: data.random_code}, {where: {id: user.id}});
                                response2.data[0].message.id = user.id
                                template(200, "", response2.data[0].message, true, res);
                            }
                            else template(400, response, [], true, res)
                        }
                        catch (e) { template(500, e, [], true, res) }
                    }
                })
                .catch(err => { template(500, err.message, [], false, res) })
        }

        function onlyNumbers (param) {
            var notDigitRegExp = /\D+/g;
            return param.replace( notDigitRegExp, "");
        }

        function smsBodyFunc(data) {
            var random_code = data.random_code;
            var action = data.action;
            if(action == 'signup') {
                // return 'Ваш код для регистрации: ' + random_code + ' '+ app_id
                return 'Код для регистрации в системе: ' + random_code
            }
            else if(action == 'resetPassword') {
                return 'Код для восстановления пароля: '+ random_code
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

exports.resetPassword_smsCode_v2 = (req, res) => {
    try {
        let {body} = req
        var options = { //опции для конвертирования json <--> xml
            compact: true,
            ignoreComment: true,
            spaces: 4
        };

        let sms_code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
        var data = { phone_number: body.phone, action: 'resetPassword', random_code: sms_code }
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
            updateUser(body);
        }
        else {
            template(403, "Неправильно введен номер телефона!", [], false, res);
        }
        
        function updateUser(body) {
            User.findOne({where: {phone: body.phone}})
                .then(async user => {
                    if(!user) {
                        let result = {
                            phone: body.phone,
                            response: "Пользователь с указанным номером не зарегистрирован в системе"
                        }
                        await PwdRstRqt.create(result)
                        template(404, "Пользователь с указанным номером не зарегистрирован в системе", [], false, res);
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
                                if(type == 'phone_number') {
                                    var param_phone = formatPhoneNumber(phone_number)
                                }
                                else {
                                    var param_phone = hideFormattedPhoneNumber(formatPhoneNumber(phone_number))
                                }
                                var response2 = await axios.get(HTTP_CONFIGS.I18N_SERVICE_URL, {
                                    data: [{code : 'smsSuccess', params: {par_1: param_phone}}]
                                });

                                await PwdRstRqt.findOne({where: {[Op.and]: [{userID: user.id}, {response: ""}]}})
                                    .then(async obj => {
                                        if(!obj) {
                                            let result = {
                                                userID: user.id,
                                                phone: user.phone,
                                                smsCode: data.random_code,
                                                response: ""
                                            }
                                            await PwdRstRqt.create(result)
                                                .then(resp => {
                                                    if(!resp) template(400, "Не удалось зарегистрировать объект", [], false, res);
                                                    else {
                                                        response2.data[0].message.id = resp.id
                                                        template(200, "", response2.data[0].message, true, res);
                                                    }
                                                })
                                        }
                                        else {
                                            await PwdRstRqt.update({smsCode: data.random_code}, {where: {id: obj.id}});
                                            response2.data[0].message.id = obj.id
                                            template(200, "", response2.data[0].message, true, res);
                                        }
                                    })
                                    .catch(err => { template(500, err.message, [], true, res) });
                            }
                            else template(400, response, [], true, res)
                        }
                        catch (e) { template(500, e, [], true, res) }
                    }
                })
                .catch(err => { template(500, err.message, [], false, res) })
        }

        function onlyNumbers (param) {
            var notDigitRegExp = /\D+/g;
            return param.replace( notDigitRegExp, "");
        }

        function smsBodyFunc(data) {
            var random_code = data.random_code;
            var action = data.action;
            if(action == 'signup') {
                // return 'Ваш код для регистрации: ' + random_code + ' '+ app_id
                return 'Код для регистрации в системе: ' + random_code
            }
            else if(action == 'resetPassword') {
                return 'Код для восстановления пароля: '+ random_code
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

exports.resetPassword = async (req, res) => {
    try {
        let {body} = req;
        await PwdRstRqt.findOne({where: {id: body.id}})
            .then(async object => {
                if(!object) template(404, "Объект не найден!", [], false, res);
                else {
                    if(body.sms_code == object.smsCode) {
                        body.password = bcrypt.hashSync(body.password, 8)
                        await User.update({password: body.password}, {where: {id: object.userID}})
                            .then(user => {
                                if(user) template(200, "Пароль успешно обновлен", [], true, res);
                                else template(400, "Не удалось обновить пароль!", [], true, res);
                            })
                            .catch(err => { template(500, err.message, [], true, res) });

                        await User.findOne({where: {id: object.userID}})
                            .then(async obj => {
                                await User.update({passwordTime: obj.updatedAt}, {where: {id: object.userID}})
                                    .catch(err => { template(500, err.message, [], true, res) });
                            })
                            .catch(err => { template(500, err.message, [], true, res) });
                    }
                    else template(403, "Введен неверный код из SMS", [], false, res);
                }
            })
            .catch(err => { template(500, err.message, [], true, res) });
    }
    catch(e) { template(500, e.message, [], true, res) }
};