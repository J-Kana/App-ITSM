module.exports = (sequelize, DataTypes ) => {
    const Role = sequelize.define("role", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        value: {
            type: DataTypes.STRING
        },
    });

    return Role;
};