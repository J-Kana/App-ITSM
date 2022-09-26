const db = require("../models");
const template = require('../templateResponse');
const Role = db.role;

exports.getObject = (req, res) => {
    try {
        let {id} = req.params
        if(!id) {
            Role.findAll()
                .then(async objects => {
                    if(objects.length === 0) template(404, "Object not found", [], true, res)
                    else template(200, "", objects, true, res)
                }).catch(err => {template(500, err.message, [], true, res)})
        }
        else {
            Role.findByPk(id)
                .then(async object => {
                    if(!object) template(404, "Object not found", [], true, res)
                    try { template(200, "", object, true ,res) }
                    catch(e) { template(500, e.message, [], true, res) }
                }).catch(err => {template(500, err.message, [], true, res)})
        }
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.objectCreate = (req, res) => {
    try {
        let {body} = req
        Role.create(body)
            .then(object=>{
                if (!object)template(501, "Object has not been registered",[],true, res)
                template(200, "Object has been successfully registered",[],true, res)
            }).catch(err => {template(500, err.message,[],true, res)});
    }
    catch(e) { template(500, e.message, [], true, res) }
};

exports.objectUpdate = (req, res) => {
    try {
        let {id} = req.params
        let {body} = req
        Role.update(body, {where: {id: id}})
            .then((response) => {
                if (response[0]) template(200, "Object has been successfully updated",[],true, res)
                else template(404, "Object not found", [], true, res)
            }).catch(err => {template(500, err.message,[],true, res)});
    }
    catch(e){ template(500, e.message, [], true, res) }
};

exports.objectDelete = (req, res) => {
    try{
        let {id} = req.params
        Role.destroy({where: {id: id}})
            .then((response) => {
                if (response === 1) template(200, "Object has been deleted",[],true, res)
                else template(404, "Object not found", [], true, res)
            }).catch(err => {template(500, err.message,[],true, res)});
    }
    catch(e) { template(500, e.message, [], true, res) }
};