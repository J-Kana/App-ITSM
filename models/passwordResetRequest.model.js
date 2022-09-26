module.exports = (sequelize, DataTypes) => {
    const pwdRstRqst = sequelize.define("passwordResetRequest", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userID: {
            type: DataTypes.INTEGER
        },
        phone: {
            type: DataTypes.STRING
        },
        smsCode: {
            type: DataTypes.STRING
        },
        response: {
            type: DataTypes.STRING
        }
    });

    return pwdRstRqst;
};
