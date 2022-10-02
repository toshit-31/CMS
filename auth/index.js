const errors = require("../errors");
const jwt = require("jsonwebtoken");

module.exports = function(session){

    return function(req, res, next){
        try {
            // check if authorization is required
            if(!req.authRequired){
                next();
                return;
            }

            const token = req.headers.authorization;
            let user = session.checkSession(token);
            
            if(!user) throw new errors.InvalidToken();
            if(req.authRequired && req.isAdmin && !user.roles.includes("admin")) throw new errors.OnlyAdminAccess();

            // check token
            req.user = user;
            
            // pass scope checking if role includes admin
            if(user.roles.includes("admin")){
                next();
                return;
            }

            // check if the user has access to the requested api
            let {method, originalUrl} = req;
            let methodPerm = {post: 2, put: 2, delete:2, get: 1};
            let urlParams = originalUrl.split("/");
            let entity = urlParams[2];
            if(urlParams[1] !== process.env.CONTENT_BASE) {
                next();
                return;
            }
            if(req.user.scopes[entity] >= methodPerm[method.toLowerCase()]){
                next()
            } else throw new errors.PermissionDenied();

        } catch(e){
            errors.sendError(res, e);
        }
    }
}