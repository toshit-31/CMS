module.exports = {
    
    sendError(res, e){
        console.log(e);
        e.code = e.code ? e.code : 500;
        res.status(e.code).json({
            err: e.name,
            msg: e.message
        })
    },

    NoUser : class NoUser extends Error {
        constructor(email){
            let msg = `User with email ${email} does not exist`
            super(msg);
            this.name = "NoUser";
            this.message = msg;
            this.code = 400;
        }
    },

    InvalidCredentials : class InvalidCredentials extends Error {
        constructor(email){
            let msg = `Wrong password for user with email ${email} does not exist`
            super(msg);
            this.name = "InvalidCredentials";
            this.message = msg;
            this.code = 401;
        }
    },

    InvalidToken : class InvalidToken extends Error {
        constructor(){
            let msg = `Invalid or no authorization token was sent`
            super(msg);
            this.name = "InvalidToken";
            this.message = msg;
            this.code = 401;
        }
    },

    IncompleteData: class IncompleteData extends Error {
        constructor(){
            let msg = `Bad request`
            super(msg);
            this.name = "BadRequest";
            this.message = msg;
            this.code = 400;
        }
    },

    InternalServerError : class InternalServerError extends Error {
        constructor(msg){
            super(msg);
            this.name = "InternalServerError";
            this.message = msg;
            this.code = 500;
        }
    },

    OnlyAdminAccess : class OnlyAdminAccess extends Error {
        constructor(){
            let msg = "This is accessible by only admin role"
            super(msg);
            this.name = "OnlyAdminAccess";
            this.message = msg;
            this.code = 403;
        }
    },

    PermissionDenied : class Permission extends Error {
        constructor(){
            let msg = "User does not have required permission"
            super(msg);
            this.name = "PrermissionDenied";
            this.message = msg;
            this.code = 403;
        }
    },

    UpdateConflict : class UpdateConflict extends Error {
        constructor(){
            let msg = "Only one from update, add or remove action can be performed on array at a particular time"
            super(msg);
            this.name = "DatabaseConflict";
            this.message = msg;
            this.code = 500;
        }
    },

    BadData : class BadData extends Error {
        constructor(){
            let msg = "Invalid data for operation";
            super(msg);
            this.name = "BadData";
            this.message = msg;
            this.code = 500;
        }
    }

}