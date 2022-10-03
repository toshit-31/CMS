const express = require("express");
const parseRouteSetting = require("./routeSettingParser");
/**
 * 
 * @param {express.Application} app 
 */

module.exports = function(app, name, routeSetting){
    let apiAccessMap = app.get("api-access-map");
    let {parsed, raw} = parseRouteSetting(name, routeSetting);
    apiAccessMap = {...apiAccessMap, ...parsed};
    app.set("api-access-map", apiAccessMap);
}