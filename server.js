require("dotenv").config();
const express = require("express");
const app = express();

let routerRegister = require("./entity/router/register")
app.use(express.json());

// api access modifier
const modifier = require("./auth/modifiers");
app.use(modifier.middleware);
let configAddresses = {
    "post,/admin/user/new/": "admin",
    "post,/user/authorize/": "public",
    "get,/user/me/": "protected",
    "post,/admin/user/assign/": "admin",
    "post,/entity/create/": "admin",
    "get,/entity/detail/": "admin",
    "put,/entity/schema/": "admin",
    "post,/entity/route-setting/": "admin",
    "post,/admin/roles/": "admin",
    "get,/admin/roles/": "admin",
    "post,/admin/roles/scopes/": "admin",
    "get,/dev/route-map/": "public"
}
app.set("api-access-map", configAddresses);

// session and authentication
const SessionMap = require("./auth/SessionMap.class");
const session = new SessionMap();
const Auth = require("./auth");
app.use(Auth(session));
app.set("session", session);


let {userRouter, adminRouter} = require("./user/routes");
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/entity", require("./entity/routes"));
app.use("/dev", require("./dev/routes"));

// create a empty register
app.set("route-index-register", {});

// load the entity as apis
// once all routers are mounted create a register for removing on updates
// start the server then
function start(){
    process.env.CONTENT_BASE = !!process.env.CONTENT_BASE ? process.env.CONTENT_BASE : "api";
    
    let {MONGO_URL, SECRET, DB_NAME} = process.env;
    if(!MONGO_URL || !SECRET || !DB_NAME) {
        console.log("environment variables missing or not defined in .env file");
        process.exit();
    }
    
    require("./entity/init").init(app).then(function(){

        // updare the route register for routers
        routerRegister.updateRegister(app);
    
        const PORT = (process.env.PORT || 1131)
        app.listen(PORT, () => console.log(`cms started on port ${PORT} ...`));
    
    });
}



module.exports.start = start;