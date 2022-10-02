const express = require("express");
// const router = express.Router;
// const {sendError} = require("../errors/");
const mongoose = require("mongoose");
const buildSchema = require("./schema").buildSchema;
const buildRouter = require("./router");
const routerRegister = require("./router/register");
const updateApiAccess = require("./utils/updateApiAccess");

/**
 * 
 * @param {express.Application} app
 * @returns {express.Router}
 */
const dynamicLoad = async function(app, {name, schema, routeSetting, deletedFields}){
    let conn = await mongoose.createConnection(process.env.MONGO_URL+"/"+process.env.DB_NAME).asPromise();
    let entityModel = conn.model(name, buildSchema(schema));
    let router = buildRouter(entityModel, (deletedFields || {}));
    // update api access map to keep up with access permission to apis
    updateApiAccess(app, name, routeSetting);
    // remove the old router with same regexp as base if any
    routerRegister.removeRouter(app, name);
    // mount the updated router
    app.use("/"+process.env.CONTENT_BASE+"/"+name.toLowerCase(), router);
    routerRegister.updateRegister(app);
}
module.exports.dynamicLoad = dynamicLoad;

module.exports.init = async function(app){
    try {
        let conn = await mongoose.createConnection(process.env.MONGO_URL+"/"+process.env.DB_NAME).asPromise();
        let coll = conn.collection("entities");
        let eData = await coll.find().toArray();
        for(let i = 0; i < eData.length; i++){
            console.log("Loading entity ... "+eData[i].name);
            await dynamicLoad(app, eData[i]);
        }
    } catch(e){
        console.log(e);
        process.exit()
    }
}