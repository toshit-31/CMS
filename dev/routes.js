const r = require("express").Router();

r.get("/route-map", function(req, res){
    res.json(req.app.get("api-access-map"));
})

module.exports = r;