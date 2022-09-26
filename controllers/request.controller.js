const fetch = require('node-fetch');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
// import BX24 from 'bx24-api';
const BX24 = require("bx24");
const path = require("path");
const template = require('../templateResponse');
const jwt = require("jsonwebtoken");
const db = require("../models");
const { timeStamp } = require('console');
const User = db.user;
const config = require('../config');
const {createCustomer, addCustomer, getOrganizationCustomers, getCustomerSearch, getJiraCustomer } = require('./customer.controller');

async function sampleMethod(url, method, body) {
    let result;
    if(!body) {
        await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Basic ${Buffer.from(config.jiraEmail + ':' + config.jiraToken).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(response => { return response.text(); })
            .then(text => { result = text; })
            .catch(err => template(500, err.message, [], true, res));
    }
    else {
        await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Basic ${Buffer.from(config.jiraEmail + ':' + config.jiraToken).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: body
        })
            .then(response => { return response.text(); })
            .then(text => { result = text; })
            .catch(err => template(500, err.message, [], true, res));
    }
    return result;
}

exports.getRequest = async (req, res) => {
    try {
        let {id} = req.params
        if(!id) {
            let val = await sampleMethod('https://mklombard.atlassian.net/rest/servicedeskapi/request', 'GET')
            const arr = []
            const textObj = JSON.parse(val);
            arr.push(textObj.values);
            template(200, "", arr, true, res);
        }
        else {
            let val = await sampleMethod('https://mklombard.atlassian.net/rest/servicedeskapi/request/' + id, 'GET')
            const textObj = JSON.parse(val);
            template(200, "", textObj, true, res)
        }
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.createRequest = async (req, res) => {
    try {
        let {body} = req
        const bodyData = '{' +
            '"serviceDeskId": "2",' +
            '"requestTypeId": "17",' +
            '"requestFieldValues": {' +
                '"summary": "' + body.summary + '",' +
                '"description": "' + body.description + '"' + 
            '}' +
        '}';
        let val = await sampleMethod('https://mklombard.atlassian.net/rest/servicedeskapi/request', 'POST', bodyData)
        const textObj = JSON.parse(val);
        template(200, "", textObj, true, res)
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.getAttachment = (req, res) => {
    try {
        fetch('https://mklombard.atlassian.net/rest/servicedeskapi/request/ITSAMPLE-27/attachment', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from(config.jiraEmail + ':' + config.jiraToken).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                console.log(`Response: ${response.status} ${response.statusText}`);
                return response.text();
            })
            .then(text => template(200, "", text, true, res))
            .catch(err => template(500, err.message, [], true, res));
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.createAttachment = async (req, res) => {
    try {
        let {id} = req.params;
        const filePath = path.join(__dirname + '../../uploads/' + req.file.originalname);
        const form = new FormData();
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        const fileStream = fs.createReadStream(filePath);
        form.append('file', fileStream, {knownLength: fileSizeInBytes});
        
        let token = req.headers["x-access-token"];
        if(!token) return template(401, "Токен не предоставлен!", [], false, res);

        jwt.verify(token, config.key, (err, decoded) => {
            if(err) return template(401, "Неавторизованный", [],false, res)
            User.findByPk(decoded.id)
                .then(async user => {
                    if(!user) template(404, "Пользователь не найден", [], true, res);
                    try {
                        fetch('https://mklombard.atlassian.net/rest/api/3/issue/' + id + '/attachments', {
                            method: 'POST',
                            body: form,
                            headers: {
                                'Authorization': `Basic ${Buffer.from(config.jiraEmail + ':' + config.jiraToken).toString('base64')}`,
                                'Accept': 'application/json',
                                'X-Atlassian-Token': 'no-check'
                            }
                        })
                            .then(response => { return response.text(); })
                            .then(text => {
                                const textObj = JSON.parse(text);
                                template(200, "", textObj, true, res);
                            })
                            .catch(err => template(500, err.message, [], true, res));
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => template(500, err.message, [], true, res));
        });
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.getIncident = async (req, res) => {
    try {
        let {id} = req.params
        let token = req.headers["x-access-token"];
        if(!token) return template(401, "Токен не предоставлен!", [], false, res)

        jwt.verify(token, config.key, (err, decoded) => {
            if(err) return template(401, "Неавторизованный", [],false, res)
            User.findByPk(decoded.id)
                .then(async user => {
                    if(!user) template(404, "Пользователь не найден", [], true, res);
                    try {
                        if(!id) {
                            /** @description Получение списка инцидентов где заголовк равен переданный инфе */
                            // let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/search/?jql=summary%20~%20%22' + user.phone + '*%22', 'GET')

                            /** @description Получение списка инцидентов где проект и заголовк равен переданный инфе */
                            // let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/search/?jql=project=' + config.projectID + '%20AND%20summary%20~%20%22' + user.phone + '*%22', 'GET')
                            
                            /** @description Получение списка инцидентов где проект, заголовк и поле reporter равен переданной инфе */
                            let customerName = `${user.surname} ${user.name} (${user.phone})`;
                            let customerEmail = `itsm-${user.IIN}@m-lombard.kz`;
                            let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/search/?jql=project=' + config.projectID
                                                                                            + '%20AND%20summary%20~%20%22' + user.phone
                                                                                            + '*%22%20OR%20reporter="' + customerEmail + '"', 'GET')
                            const textObj = JSON.parse(val);
                            let result = [], resultObject;
                            for(let each of textObj.issues) {
                                resultObject = {
                                    id: each.id,
                                    key: each.key,
                                    fields: {
                                        statuscategorychangedate: each.fields.statuscategorychangedate,
                                        summary: each.fields.summary,
                                        description: each.fields.description.content.map(item => item.content.map(item => item.text)[0])[0],
                                        status: each.fields.status.name,
                                        reporter: each.fields.reporter,
                                        issuetype: each.fields.issuetype,
                                        priority: each.fields.priority,
                                        duedate: each.fields.duedate,
                                        progress: each.fields.progress,
                                        resolution: each.fields.customfield_10051,
                                        response: each.fields.customfield_10052,
                                        post_resolution: each.fields.customfield_10053,
                                        review: each.fields.customfield_10054,
                                        requesttype: each.fields.customfield_10010,
                                        resolutiondate: each.fields.resolutiondate,
                                        timespent: each.fields.timespent,
                                        created: each.fields.created,
                                        updated: each.fields.updated
                                    }
                                }
                                result.push(resultObject);
                            }
                            template(200, "", result, true, res);
                        }
                        else {
                            let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/issue/' + id, 'GET')
                            const textObj = JSON.parse(val);
                            textObj.fields.description = textObj.fields.description.content.map(item => item.content.map(item => item.text)[0])[0];
                            textObj.fields.attachment = textObj.fields.attachment.map(item => ({id: item.id, filename: item.filename, created: item.created, author: item.author.displayName}));
                            let commentArr = [];
                            for(let each of textObj.fields.comment.comments) {
                                each.author = each.author.displayName;
                                each.updateAuthor = each.updateAuthor.displayName;
                                each.body = each.body.content.map(item => item.content.map(item => item.text)[0])[0];
                                if(each.jsdPublic == true) commentArr.push(each)
                            }

                            let result = {
                                    id: textObj.id,
                                    key: textObj.key,
                                    fields: {
                                        statuscategorychangedate: textObj.fields.statuscategorychangedate,
                                        summary: textObj.fields.summary,
                                        description: textObj.fields.description,
                                        status: textObj.fields.status.name,
                                        reporter: textObj.fields.reporter,
                                        attachment: textObj.fields.attachment,
                                        comment: commentArr,
                                        issuetype: textObj.fields.issuetype,
                                        priority: textObj.fields.priority,
                                        duedate: textObj.fields.duedate,
                                        progress: textObj.fields.progress,
                                        resolution: textObj.fields.customfield_10051,
                                        response: textObj.fields.customfield_10052,
                                        post_resolution: textObj.fields.customfield_10053,
                                        review: textObj.fields.customfield_10054,
                                        requesttype: textObj.fields.customfield_10010,
                                        resolutiondate: textObj.fields.resolutiondate,
                                        timespent: textObj.fields.timespent,
                                        created: textObj.fields.created,
                                        updated: textObj.fields.updated
                                    }
                                }
                            template(200, "", result, true, res);
                        }
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => template(500, err.message, [], true, res));
        });
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.createIncident = async (req, res) => {
    try {
        let {body} = req
        let token = req.headers["x-access-token"];
        if(!token) return template(401, "Токен не предоставлен!", [], false, res)

        jwt.verify(token, config.key, (err, decoded) => {
            if(err) return template(401, "Неавторизованный", [],false, res)
            User.findByPk(decoded.id)
                .then(async user => {
                    if(!user) template(404, "Пользователь не найден", [], true, res)
                    try {
                        const bodyData = '{' +
                            '"fields": {' +
                                '"summary": "' + user.phone + '",' +
                                '"issuetype": {"id": "10001"},' +
                                '"project": {"id": "' + config.projectID + '"},' +
                                '"description": {' +
                                    '"type": "doc",' +
                                    '"version": 1,' +
                                    '"content": [{' +
                                        '"type": "paragraph",' +
                                        '"content": [{' +
                                            '"text": "' + body.description + '",' +
                                            '"type": "text"' +
                                        '}]' +
                                    '}]' +
                                '}' +
                            '}' +
                        '}';

                        let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/issue', 'POST', bodyData)
                        const textObj = JSON.parse(val);
                        template(200, "", textObj, true, res)
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => template(500, err.message, [], true, res));
        });
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.createIncident_v2 = async (req, res) => {
    try {
        let {body} = req
        let token = req.headers["x-access-token"];
        if(!token) return template(401, "Токен не предоставлен!", [], false, res)

        jwt.verify(token, config.key, (err, decoded) => {
            if(err) return template(401, "Неавторизованный", [],false, res)
            User.findByPk(decoded.id)
                .then(async user => {
                    if(!user) template(404, "Пользователь не найден", [], true, res)
                    try {
                        let customerName = `${user.surname} ${user.name} (${user.phone})`;
                        let customerEmail = `itsm-${user.IIN}@m-lombard.kz`;
                        let customerID = await createCustomer(customerName, customerEmail);

                        /** @description --- Проверка наличия пользователя в системе Jira Atlassian */
                        if(customerID.status == 200) {
                            let customerResult = await addCustomer(customerID.data.accountId);
                            if(customerResult.status == 200) {
                                let outcome = await createTheIncident(user.phone, customerID.data.accountId)
                                template(200, "", outcome, true, res);

                                // if(body.branch.toUpperCase() == "НЕТ") body.employee = "НЕТ"
                                // const bodyData = '{' +
                                //     '"fields": {' +
                                //         '"summary": "' + user.phone + '",' +
                                //         '"issuetype": {"id": "10001"},' +
                                //         '"project": {"id": "' + config.projectID + '"},' +
                                //         '"reporter": {"id": "' + customerID.data.accountId + '"}, ' +
                                //         '"description": {' +
                                //             '"type": "doc",' +
                                //             '"version": 1,' +
                                //             '"content": [{' +
                                //                 '"type": "paragraph",' +
                                //                 '"content": [{' +
                                //                     '"text": "' + body.description + 
                                //                         '\\nФилиал может работать: ' + body.branch.toUpperCase() + 
                                //                         '\\nСотрудник может работать: ' + body.employee.toUpperCase() + '",' +
                                //                     '"type": "text"' +
                                //                 '}]' +
                                //             '}]' +
                                //         '}' +
                                //     '}' +
                                // '}';

                                // let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/issue', 'POST', bodyData)
                                // const textObj = JSON.parse(val);
                                // template(200, "", textObj, true, res)
                            }
                            else template(504, "", customerResult.data, true, res);
                        }
                        else if(customerID.data.includes('An account already exists for this email')) {
                            /** @description --- Проверка наличия пользователя в организации вниутри Jira Atlassian */
                            let customersAnswer = await getOrganizationCustomers();
                            let customers = customersAnswer.values;
                            let customerData = null;
                            const containsIIN = !!customers.find(customer => {
                                if(customer.emailAddress === customerEmail) customerData = customer;
                                return customerData;
                            })
                            if(containsIIN) {
                                let outcome = await createTheIncident(user.phone, customerData.accountId)
                                template(200, "", outcome, true, res);
                            }
                            else {
                                /** @description --- Поиск пользователя через поле 'displayName' */
                                const searchCustomer = await getCustomerSearch(customerName);
                                const customerInfo = searchCustomer.find(each => { return ((each.displayName === customerName) && (each.emailAddress === customerEmail)) });
                                if(customerInfo) {
                                    let customerResult = await addCustomer(customerInfo.accountId);
                                    if(customerResult.status == 200) {
                                        let outcome = await createTheIncident(user.phone, customerInfo.accountId)
                                        template(200, "", outcome, true, res);
                                    } else template(504, "", customerResult.data, true, res);
                                }
                                else template(403, "Ошибка поиска пользователя в Jira!", [], true, res);
                            }
                        }
                        else template(503, "", customerID.data, true, res);
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => template(500, err.message, [], true, res));
        });

        async function createTheIncident(phone, accountId) {
            if(body.branch.toUpperCase() == "НЕТ") body.employee = "НЕТ"
            const bodyData = '{' +
                '"fields": {' +
                    '"summary": "' + phone + '",' +
                    '"issuetype": {"id": "10001"},' +
                    '"project": {"id": "' + config.projectID + '"},' +
                    '"reporter": {"id": "' + accountId + '"}, ' +
                    '"description": {' +
                        '"type": "doc",' +
                        '"version": 1,' +
                        '"content": [{' +
                            '"type": "paragraph",' +
                            '"content": [{' +
                                '"text": "' + body.description + 
                                    '\\nФилиал может работать: ' + body.branch.toUpperCase() + 
                                    '\\nСотрудник может работать: ' + body.employee.toUpperCase() + '",' +
                                '"type": "text"' +
                            '}]' +
                        '}]' +
                    '}' +
                '}' +
            '}';
    
            let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/issue', 'POST', bodyData)
            const textObj = JSON.parse(val);
            return textObj;
            // template(200, "", textObj, true, res)
        }
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.updateIncident = async (req, res) => {
    try {
        let {id} = req.params
        let {body} = req
        let token = req.headers["x-access-token"];
        if(!token) return template(401, "Токен не предоставлен!", [], false, res)

        jwt.verify(token, config.key, (err, decoded) => {
            if(err) return template(401, "Неавторизованный", [],false, res)
            User.findByPk(decoded.id)
                .then(async user => {
                    if(!user) template(404, "Пользователь не найден", [], true, res)
                    try {
                        const bodyData = '{' +
                            '"update": {' +
                                '"fields": {' +
                                '}' + 
                            '}' +
                        '}';

                        let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/issue/' + id, 'PUT', bodyData)
                        const textObj = JSON.parse(val);
                        template(200, "", textObj, true, res);
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => template(500, err.message, [], true, res));
        });
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.createIncidentWithAttachment = async (req, res) => {
    try {
        let {body} = req
        let token = req.headers["x-access-token"];
        if(!token) return template(401, "Токен не предоставлен!", [], false, res)

        jwt.verify(token, config.key, (err, decoded) => {
            if(err) return template(401, "Неавторизованный", [],false, res)
            User.findByPk(decoded.id)
                .then(async user => {
                    if(!user) template(404, "Пользователь не найден", [], true, res)
                    try {
                        const bodyData = '{' +
                            '"fields": {' +
                                '"summary": "' + user.phone + '",' +
                                '"issuetype": {"id": "10001"},' +
                                '"project": {"id": "' + config.projectID + '"},' +
                                '"description": {' +
                                    '"type": "doc",' +
                                    '"version": 1,' +
                                    '"content": [{' +
                                        '"type": "paragraph",' +
                                        '"content": [{' +
                                            '"text": "' + body.description + '",' +
                                            '"type": "text"' +
                                        '}]' +
                                    '}]' +
                                '}' +
                            '}' +
                        '}';

                        let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/issue', 'POST', bodyData)
                        const textObj = JSON.parse(val);

                        if(textObj) {
                            const fileObjects = []
                            const obj = {
                                fileObj: null,
                                textObj: textObj
                            }
                            for(let eachFile of req.files) {
                                const filePath = path.join(__dirname + '../../uploads/' + eachFile.originalname);
                                const form = new FormData();
                                const stats = fs.statSync(filePath);
                                const fileSizeInBytes = stats.size;
                                const fileStream = fs.createReadStream(filePath);
                                form.append('file', fileStream, {knownLength: fileSizeInBytes});
                
                                await fetch('https://mklombard.atlassian.net/rest/api/3/issue/' + textObj.key + '/attachments', {
                                    method: 'POST',
                                    body: form,
                                    headers: {
                                        'Authorization': `Basic ${Buffer.from(config.jiraEmail + ':' + config.jiraToken).toString('base64')}`,
                                        'Accept': 'application/json',
                                        'X-Atlassian-Token': 'no-check'
                                    }
                                })
                                    .then(response => { return response.text(); })
                                    .then(text => {
                                        let arr = JSON.parse(text);
                                        fileObjects.push(arr[0]);
                                    })
                                    .catch(err => template(500, err.message, [], true, res));
                            }
                            obj.fileObj = fileObjects
                            template(200, "", obj, true, res);
                        }
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => template(500, err.message, [], true, res));
        });
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.getComment = async (req, res) => {
    try {
        let id;
        if(!req.params.id2) id = '';
        else id = req.params.id2;

        let token = req.headers["x-access-token"];
        if(!token) return template(401, "Токен не предоставлен!", [], false, res)

        jwt.verify(token, config.key, (err, decoded) => {
            if(err) return template(401, "Неавторизованный", [],false, res)
            User.findByPk(decoded.id)
                .then(async user => {
                    if(!user) template(404, "Пользователь не найден", [], true, res)
                    try {
                        if(!id) {
                            let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/issue/' + req.params.id1 + '/comment', 'GET')
                            const textObj = JSON.parse(val);
                            for(let each of textObj.comments) {
                                each.author = each.author.displayName;
                                each.updateAuthor = each.updateAuthor.displayName;
                                each.body = each.body.content.map(item => item.content.map(item => item.text)[0])[0];
                            }
                            template(200, "", textObj, true, res);
                        }
                        else {
                            let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/issue/' + req.params.id1 + '/comment/' + id, 'GET')
                            const textObj = JSON.parse(val);
                            textObj.author = textObj.author.displayName;
                            textObj.updateAuthor = textObj.updateAuthor.displayName;
                            textObj.body = textObj.body.content.map(item => item.content.map(item => item.text)[0])[0];
                            template(200, "", textObj, true, res)
                        }
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => template(500, err.message, [], true, res));
        });
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.createComment = async (req, res) => {
    try {
        let {id} = req.params
        let {body} = req
        let token = req.headers["x-access-token"];
        if(!token) return template(401, "Токен не предоставлен!", [], false, res)

        jwt.verify(token, config.key, (err, decoded) => {
            if(err) return template(401, "Неавторизованный", [],false, res)
            User.findByPk(decoded.id)
                .then(async user => {
                    if(!user) template(404, "Пользователь не найден", [], true, res)
                    try {
                        const bodyData = '{' +
                            '"visibility": {' +
                                '"type": "role",' +
                                '"value": "Administrators"' +
                            '},' +
                            '"body": {' +
                                '"type": "doc",' +
                                '"version": 1,' +
                                '"content": [{' +
                                    '"type": "paragraph",' +
                                    '"content": [{' +
                                        '"text": "' + body.description + '",' +
                                        '"type": "text"' +
                                    '}]' +
                                '}]' +
                            '}' +
                        '}';

                        let val = await sampleMethod('https://mklombard.atlassian.net/rest/api/3/issue/' + id + '/comment', 'POST', bodyData)
                        const textObj = JSON.parse(val);
                        if(textObj.errorMessages) template(500, textObj, [], true, res);
                        else template(200, "", textObj, true, res);
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => template(500, err.message, [], true, res));
        });
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.createBitrix = async (req, res) => {
    try {
        let {id} = req.params
        let {body} = req
        let token = req.headers["x-access-token"];
        if(!token) return template(401, "Токен не предоставлен!", [], false, res)

        jwt.verify(token, config.key, (err, decoded) => {
            if(err) return template(401, "Неавторизованный", [],false, res)
            User.findByPk(decoded.id)
                .then(async user => {
                    if(!user) template(404, "Пользователь не найден", [], true, res)
                    try {
                        // BX24.callMethod('user.add', {"EMAIL": "newuser@example.com"});
                        // BX24.callMethod('user.get', {"ID": 980});
                        // BX24.callMethod('user.fields');
                        // template(200, "", textObj, true, res);

                        // const url = `https://bitrix-test.m-lombard.kz/rest/${idAuth}/${keyAuth}/crm.lead.add.json`;
                        // const url = `https://portal.m-lombard.kz/rest/user.get.json?ID=1&auth=7790oqv2idpnnn3x38dfftgl7ztih3n8`;
                        const url = `https://portal.m-lombard.kz/rest/4714/jbhyuxeaz1rbv4y9/profile.json`;
                        // const url = `https://portal.m-lombard.kz/rest/4714/jbhyuxeaz1rbv4y9/user.get.json`;
                        let data = {
                            fields: {
                                TITLE: "",
                                NAME: "Clark",
                                STATUS_ID: "20",
                                OPENED: "20",
                                LAST_NAME: "",
                                SOURCE_ID: "",
                                POST: "",
                                BIRTHDATE: "",
                                UF_CRM_KOMMENTARII: '',
                                UF_CRM_1545200238: '216', // тип лида
                                PHONE: [{
                                    VALUE: "",
                                    VALUE_TYPE: "WORK"
                                }],
                                EMAIL: [{
                                    VALUE_TYPE: "WORK",
                                    VALUE: "",
                                }],
                                WEB: [{
                                    VALUE_TYPE: "WORK",
                                    VALUE: "",
                                }]
                            },
                            params: {
                                "REGISTER_SONET_EVENT": "Y"
                            }
                        }
                        
                        await fetch(url, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            }
                            // body: JSON.stringify({ fields: data.fields })
                        })
                        .then(function (response) {
                            // loader.classList.add("hiden");
                            // success.classList.remove("hiden");
                            // return console.log('Request succeeded', response.json());
                            let result = {
                                status: response.status,
                                text: response.statusText
                            }
                            template(200, "", result, true, res);
                        })
                        .catch(function (error) {
                            // loader.classList.add("hiden");
                            // fail.classList.remove("hiden");
                            // console.log('Request failed', error);
                            template(200, error, [], true, res);
                        });

                        // template(200, "", textObj, true, res);
                    }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => template(500, err.message, [], true, res));
        });
    }
    catch(e) { template(500, e.message, [], true, res) }
};