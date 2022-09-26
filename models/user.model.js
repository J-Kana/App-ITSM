module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("user", {
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
        email: {
            type: DataTypes.STRING,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING,
            unique: true,
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
        passwordTime: {
            type: DataTypes.DATE
        },
        jiraAccountId: {
            type: DataTypes.STRING
        }
    });

    return User;
};
