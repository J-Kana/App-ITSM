module.exports = (sequelize, DataTypes) => {
    const Registration = sequelize.define("registration", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        surname: {
            type: DataTypes.STRING,
            allowNull: false
        },
        patronymic: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        IIN: {
            type: DataTypes.STRING
        },
        supervisor_fullname: {
            type: DataTypes.STRING
        },
        supervisor_phone: {
            type: DataTypes.STRING
        },
        smsCode: {
            type: DataTypes.STRING
        },
        userID: {
            type: DataTypes.INTEGER
        },
        response: {
            type: DataTypes.STRING
        }
    });

    return Registration;
};
