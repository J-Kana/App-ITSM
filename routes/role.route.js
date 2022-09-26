const { authJwt } = require("../middleware");
const controller = require("../controllers/role.controller");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get("/role/getObject/:id?",
        [authJwt.verifyToken],
        controller.getObject
    );

    app.post("/role/createObject",
        [authJwt.verifyToken, authJwt.isAdmin],
        controller.objectCreate
    );

    app.put("/role/updateObject/:id",
        [authJwt.verifyToken, authJwt.isAdmin],
        controller.objectUpdate
    );
    app.delete("/role/deleteObject/:id",
        [authJwt.verifyToken, authJwt.isAdmin],
        controller.objectDelete
    );
};