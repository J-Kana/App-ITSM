const controller = require("../controllers/request.controller");
const { authJwt } = require("../middleware");
const path = require('path');
const template = require("../templateResponse");
const multer = require('multer');

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    /******************************     Storage and multer library for uploading the files     **********************************/
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname + '../../uploads/'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    });
    let upload = multer({
        storage: storage,
        fileFilter: function (req, file, cb) {
            var filetypes = /pdf|doc|xml|png|jpg|jpeg|docx|docm|dotx|xps|txt|xlsx|xlsm/;
            var mimetype = filetypes.test(file.mimetype);
            var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            if (mimetype && extname) {
                return cb(null, true);
            }
            else { cb("Error: File upload only supports the following filetypes - " + filetypes); }
        }
    });
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/request/getObject/:id?", [authJwt.verifyToken], controller.getRequest);
    app.post("/request/createObject", [authJwt.verifyToken], controller.createRequest);

    app.get("/attachment/getObject/:id?", [authJwt.verifyToken], controller.getAttachment);
    app.post("/attachment/createObject/:id",
        [authJwt.verifyToken,
            (req, res, next) => {
                upload.single('file')(req, res, (err) => {
                    var filetypes = /pdf|doc|xml|png|jpg|jpeg|docx|docm|dotx|xps|txt|xlsx|xlsm/;
                    if(err) return template(500, "Error: File upload only supports the following filetypes - " + filetypes, err.message, true, res);
                    else next();
                })
            }
        ],
        controller.createAttachment
    );

    app.get("/incident/getObject/:id?", [authJwt.verifyToken], controller.getIncident);
    app.post("/incident/createObject", [authJwt.verifyToken], controller.createIncident);
    app.post("/incident/createObject_v2", [authJwt.verifyToken], controller.createIncident_v2);
    app.put("/incident/updateObject/:id", [authJwt.verifyToken], controller.updateIncident);
    app.post("/incident/createObject/attachment",
        [authJwt.verifyToken,
            (req, res, next) => {
                upload.any('file')(req, res, (err) => {
                    var filetypes = /pdf|doc|xml|png|jpg|jpeg|docx|docm|dotx|xps|txt|xlsx|xlsm/;
                    if(err) return template(500, "Error: File upload only supports the following filetypes - " + filetypes, err.message, true, res);
                    else next();
                })
            }
        ],
        controller.createIncidentWithAttachment
    );

    app.get("/comment/getObject/:id1/comment/:id2?", [authJwt.verifyToken], controller.getComment);
    app.post("/comment/createObject/:id", [authJwt.verifyToken], controller.createComment);

    app.post("/bitrix/createObject", [authJwt.verifyToken], controller.createBitrix);
};
