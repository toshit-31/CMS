const mongoose = require("mongoose");

const Roles = new mongoose.Schema({
    name: {type: String, required: true, unique: true},
    isAdmin: {type: Boolean, default: false},
    scopes: {type: Map, of: Number}
}, {versionKey: false})
module.exports.Roles = Roles;

/**
 * 
 * @param {mongoose.Connection} connection 
 * @returns
 */
module.exports.Users = new mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    password: {type: String, required: true},
    createdBy: {type: String},
    email: {type: String, required: true},
    phone: {type: String, required: false},
    roles: {type: [String], required: true}
}, {versionKey: false})

// roles
// admin, user