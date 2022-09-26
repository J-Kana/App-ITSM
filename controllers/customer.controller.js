const fetch = require('node-fetch');
const template = require('../templateResponse');
const config = require('../config');

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

 async function createCustomer (name, email) {
    try {
        let result = { status: null, data: null }
        const bodyData = `{
            "displayName": "${name}",
            "email": "${email}"
          }`;
        let val = await sampleMethod('https://mklombard.atlassian.net/rest/servicedeskapi/customer', 'POST', bodyData)
        const textObj = JSON.parse(val);
        if(textObj.errorMessage) {
            result = { status: 403, data: textObj.errorMessage }
            return result;
        }
        else {
            result = { status: 200, data: textObj }
            return result;
        }
    }
    catch(e) {
        result = { status: 500, data: e }
        return result;
    }
};

async function addCustomer (id) {
    try {
        let result = { status: null, data: null }
        const bodyData = `{
            "accountIds": [
                "${id}"
            ],
            "usernames": []
        }`;
        let val = await sampleMethod('https://mklombard.atlassian.net/rest/servicedeskapi/organization/1/user', 'POST', bodyData)
        if(val == '') {
            result = { status: 200, data: val }
            return result;
        }
        else {
            const textObj = JSON.parse(val);
            if(textObj.errorMessage) {
                result = { status: 403, data: textObj.errorMessage }
                return result;
            }
            else {
                result = { status: 200, data: textObj }
                return result;
            }
        }
    }
    catch(e) {
        result = { status: 500, data: e }
        return result;
    }
};

async function getCustomerSearch (name) {
    try {
        let result;
        await fetch('https://mklombard.atlassian.net/rest/api/3/user/search?query="' + name + '"', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from(config.jiraEmail + ':' + config.jiraToken).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(response => { return response.text(); })
            .then(text => { result = text; })
            .catch(err => { return err });
        const textObj = JSON.parse(result);
        return textObj;
    }
    catch(e) { template(500, e.message, [], true, res) }
};

async function getJiraCustomer () {
    try {
        let result;
        await fetch('https://mklombard.atlassian.net/rest/servicedeskapi/servicedesk/1/customer', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from(config.jiraEmail + ':' + config.jiraToken).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-ExperimentalApi': 'opt-in'
            }
        })
            .then(response => {
                return response.text();
            })
            .then(text => { result = text; })
            .catch(err => { return err });
        const textObj = JSON.parse(result);
        return textObj;
    }
    catch(e) {
        result = { status: 500, data: e }
        return result;
    }
};

async function getOrganizationCustomers () {
    try {
        let result;
        await fetch('https://mklombard.atlassian.net/rest/servicedeskapi/organization/1/user', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from(config.jiraEmail + ':' + config.jiraToken).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-ExperimentalApi': 'opt-in'
            }
        })
            .then(response => { return response.text(); })
            .then(text => { result = text; })
            .catch(err => { return err });
        const textObj = JSON.parse(result);
        return textObj;
    }
    catch(e) { template(500, e.message, [], true, res) }
};

const exportResult = {
    createCustomer: createCustomer,
    addCustomer: addCustomer,
    getOrganizationCustomers: getOrganizationCustomers,
    getJiraCustomer: getJiraCustomer,
    getCustomerSearch: getCustomerSearch
}

module.exports = exportResult;