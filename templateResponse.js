// Шаблон запросов
const template = (status, message, data, auth, res) => {
    res.status(status).json({
        status: status,
        message: message,
        data: data,
        auth: auth
    })
}

module.exports = template