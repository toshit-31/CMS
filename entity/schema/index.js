const mongoose = require("mongoose");

const dataTypes = {
    "string": {type: String},
    "string_array": {type: [String]},
    "int": {
        type: Number,
        validate: {
            validator(v){
                return Math.floor(v) == v;
            },
            message: "integer expected"
        }
    },
    "int_array": {
        type: [Number],
        validate: {
            validator(v){
                return v.contructor == [].contructor &&
                v.every( e => Math.floor(e) == e);
            },
            message: "integer array expected"
        }
    },
    "float": {type: Number},
    "float_array": {
        type: [Number],
        validate: {
            validator(v){
                return v.contructor == [].contructor &&
                v.every( e => !isNaN(e));
            },
            message: "float array expected"
        }
    },
    "array": {type: Array},
    "date": {type: Date},
    "boolean": {type: Boolean},
    "map": {type: Map}
}
module.exports.dataTypes = dataTypes;

module.exports.buildSchema = function(doc){
    let schema = new mongoose.Schema({}, {versionKey: false});
    for(let key in doc){
        let keyObj = {[key] : dataTypes[doc[key].type]};
        if(doc[key].req) keyObj[key].required = true;
        if(doc[key].def) keyObj[key].default = keyObj[key].def;
        schema.add(keyObj);
    }
    schema.add({"byUser": {type: String, default: "any"}})
    return schema;
}
