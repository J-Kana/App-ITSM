// require('custom-env').env();        // Файл со всеми данными сервера и бд
const express = require("express");
const app = express();
const cors = require('cors');
const path = require('path');
const config = require('./config');
const https = require('https');
const fs = require('fs');
const template = require('./templateResponse');
const initial = require("./other/instaldb");
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: '50kb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '50kb' }))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'upload')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(cors(''));
const { HOST_PORT, NODE_ENV } = config

const db = require('./models');
// Строка для синхронизации изменении с БД
db.sequelize.sync();

// Строки для полного изменения БД, сохраняя при этом уже существующие данные
// db.sequelize.sync({ alter: true }).then(() => {       // alter: true,     force: false
//    console.log('Altered and Re-synced Database');
//    initial();
// });

////////////////////    ROUTES      //////////////////////
require('./routes/auth.route')(app);
require('./routes/user.route')(app);
require('./routes/role.route')(app);
require('./routes/request.route')(app);

app.use((req, res) => { template(404, "Route '" + req.url + "' not found!", [], false, res); })

if (NODE_ENV == 'development') {
    let httpsOptions = {
        key: fs.readFileSync('./certs/m-lombard.key'),
        cert: fs.readFileSync('./certs/m-lombard.pem')
    }
    const server = https.createServer(httpsOptions, app).listen(HOST_PORT, () => {
        console.log("Test server started on port " + HOST_PORT + "!", Date())
    })
}
else if (NODE_ENV == 'production') {
    let httpsOptions = {
        key: fs.readFileSync('./certs/m-lombard.key'),
        cert: fs.readFileSync('./certs/m-lombard.pem')
    }
    const server = https.createServer(httpsOptions, app).listen(HOST_PORT, () => {
        console.log("Server started on port " + HOST_PORT + "!", Date())
    })
}
else if(NODE_ENV == 'localhost') {
    app.listen(HOST_PORT, () => {
        console.log("Localhost server started on port " + HOST_PORT + "!", Date())
    });
}