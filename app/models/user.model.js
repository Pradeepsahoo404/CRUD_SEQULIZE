// Define the User model
const { DataTypes } = require("sequelize");
const db = require("../config/db")
const sequelize = db.sequelize;

const User = sequelize.define("User", {
    name: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    bio: {
        type: DataTypes.STRING
    },
    image: {
        type: DataTypes.STRING
    },
    addharCard: {
        type: DataTypes.STRING
    },
    panCard: {
        type: DataTypes.STRING
    },
})

module.exports = User
