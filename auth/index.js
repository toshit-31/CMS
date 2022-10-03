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
            
            // check if session exists
            if(!user) throw new errors.InvalidToken();
            // check if admin access is required
            if(req.adminRequired && !user.roles.includes("admin")) throw new errors.OnlyAdminAccess();
            req.user = user;
            // if admin bypass all scope check
            if(req.user.roles.includes("admin")){
                next();
                return;
            }

            // scope check
            let {method, originalUrl, api} = req;
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