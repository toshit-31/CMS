function parseRouteSetting(name, routeSetting, routeREEnable){
    const base = process.env.CONTENT_BASE;
    let routeMap = {}
    let actionMethodMap = {
        "create": "post",
        "get": "get",
        "getbyid": "get",
        "deletebyid": "delete",
        "updatebyid": "put"
    }
    let parsed = {
        [name.toLowerCase()] : {
            get: [routeSetting.get, routeSetting.getbyid],
            post: [routeSetting.create],
            put: [null, routeSetting.updatebyid],
            delete: [null, routeSetting.deletebyid]
        }
    }
    for(let action in routeSetting){
        let method = actionMethodMap[action];
        let route = `${method},/${base}/${name.toLowerCase()}/`;
        // let routeRE = "\\["+method+"\\]"+"/"+base+"/"+name.toLowerCase();
        if(action.endsWith("byid")){
            // routeRE += "/(.*)"
            route += ":id"
        }
        routeMap[route] = actionMethodMap[action];
    }
    return routeREEnable ? 
    {parsedSetting: parsed, routeMap} : {routeMap};
}
/**
 * 
 * @param {String} entityName 
 * @param {Map} routeSetting 
 */
function routeSettingParser(entityName, routeSetting){
    const base = process.env.CONTENT_BASE;
    let actionMethodMap = {
        "create": "post",
        "get": "get",
        "getbyid": "get",
        "deletebyid": "delete",
        "updatebyid": "put"
    }
    let parsedSetting = {};
    for(let action in routeSetting){
        if(!(action in actionMethodMap)) {
            delete routeSetting[action];
            continue;
        }
        let method = actionMethodMap[action];
        let routeKey = `${method},/${base}/${entityName.toLowerCase()}/`
        if(action.endsWith("byid")){
            routeKey+=":id";
        }
        parsedSetting[routeKey] = routeSetting[action];
    }
    return {
        raw: (routeSetting || {}), // for updating the database
        parsed: parsedSetting // for updating the in-memory object
    }
}

module.exports = routeSettingParser;