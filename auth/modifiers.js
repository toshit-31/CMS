const path = require("path");
const modifiers = ["public", "protected", "admin"];

const getAccessLevel = function(map, method, url){
    let s = url.match(/([a-zA-z0-9-_]+)/gi);
    let [api, name, id] = s;
    let routeKey = `${method},/${api}/${name}/` + (id ? ":id" : "")
    if(map[routeKey]){
        return map[routeKey];
    } else return false;
}

module.exports.middleware = function(req, res, next){
    let url = req.originalUrl.split("?")[0];
    let [api, name] = url.match(/([a-zA-z0-9-_]+)/gi);
    let apiAccessMap = req.app.get("api-access-map");
    let accessLevel = getAccessLevel(apiAccessMap, req.method.toLowerCase(), url);
    if(accessLevel){
        if(accessLevel == "admin"){
            req.authRequired = true;
            req.adminRequired = true;
        } else {
            req.isAdmin = false;
            req.api = api;
            if(accessLevel == "public"){
                req.authRequired = false;
            } else {
                req.authRequired = true;
            }
        }
        next();
    } else res.sendStatus(404);
}