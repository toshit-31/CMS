const crypto = require("crypto");
const mongoose = require("mongoose");
const { NoUser, sendError, IncompleteData, InvalidCredentials, OnlyAdminAccess } = require("../errors");
const schema = require("./schema");
const jwt = require("jsonwebtoken");

const connection = mongoose.createConnection(process.env.MONGO_URL+"/"+process.env.DB_NAME);
let User = connection.model("Users", schema.Users);
let Role = connection.model("Roles", schema.Roles);
let RoleList = {};

const updateRoleList = async function(){
    let roles = await Role.find({}).exec();
    roles.forEach( r => {
        let scopes = JSON.parse(JSON.stringify(r.scopes));
        RoleList[r.name] = {
            name: r.name,
            _id: r._id.toString(),
            scopes,
            isAdmin: r.isAdmin
        }
    })
}
updateRoleList();

const getScopes = function(roles){
    let scopes = {};
    roles.forEach( r => {
        let roleScopes = RoleList[r].scopes;
        for(let s in roleScopes){
            scopes[s] = Math.max(scopes[s] || 0, roleScopes[s]);
        }
    })
    return scopes;
}

module.exports = {
    async createUser(req, res){
        try {
            let user = await User.findOne({email: req.email}).exec();
            if(user){
                throw new NoUser(req.email);
            }
            if(!(req.body.roles && req.body.roles.every( r => !!RoleList[r]))) {
                throw new IncompleteData();
            }
            user = new User(req.body);
            user.password = crypto.createHash("sha256").update(user.password).digest("hex");
            await user.save();

            res.sendStatus(200);
        } catch(e){
            console.log(e)
            sendError(res, e)
        }
    },

    async getAccessToken(req, res){
        try {
            let {email, password} = req.body;

            if(!email || !password) throw new IncompleteData();
            let user = await User.findOne({email}).populate("roles", "-isAdmin -_id");

            if(!user) throw new NoUser(email);
            let passwordHash = crypto.createHash("sha256").update(password).digest("hex");
            
            if(passwordHash != user.password) throw new InvalidCredentials(email);

            let scopes = getScopes(user.roles);
            let payload = {
                id: user._id.toString(),
                email: email,
                roles: user.roles,
                scopes
            };
            const token = jwt.sign(payload, process.env.SECRET, {
                algorithm: "HS256",
                expiresIn: 86400
            })
            req.app.get("session").addSession(token, payload);
            res.status(200).json({
                email,
                token,
                timestamp: new Date().getTime() 
            });
        } catch(e){
            sendError(res, e)
        }
    },

    async getDetails(req, res){
        try {
            let details = req.user;
            res.status(200).json(details);
        } catch(e){
            sendError(res, e);
        }
    },

    async getRoles(req, res){
        try {
            const {isAdmin} = req;
            if(!isAdmin) throw new OnlyAdminAccess();

            let r = RoleList;
            res.json(r);
        } catch(e){
            sendError(res, e)
        }
    },

    async createRoles(req, res){
        try {
            const {isAdmin} = req;
            if(!isAdmin) throw new OnlyAdminAccess();

            let {name, scopes} = req.body;
            if(!name || scopes.length == 0) throw new IncompleteData();
            let _scopes = {};
            scopes.forEach( s => {
                let [ent, perm] = s.split(":");
                if(!isNaN(parseInt(perm)) && parseInt(perm) < 3 && parseInt(perm) >= 0)
                _scopes[ent] = parseInt(perm);
            })

            let r = await new Role({name, scopes: _scopes}).save();
            await updateRoleList()

            if(r._id){
                res.json({
                    success: true,
                    data: {
                        name,
                        scopes: _scopes
                    }
                })
            } else {
                res.status(500).json({
                    success: false
                })
            }
        } catch(e){
            sendError(res, e);
        }
    },

    async editUserRoles(req, res){
        try {
            const {isAdmin} = req;
            if(!isAdmin) throw new OnlyAdminAccess();

            let {email, update} = req.body;
            if(!email || !update || update.length == 0) throw new IncompleteData()
            let user = await User.findOne({email}).exec();
            if(!user) throw new NoUser(email);
            let roles = {};
            user.roles.forEach( r => {
                roles[r] = 1
            })
            for(let i = 0; i < update.length; i++){
                let [role, s] = update[i].split(":");
                if(!RoleList[role]) throw new IncompleteData()
                if(s == "add"){
                    roles[role] = 1;
                } else if(s == "delete"){
                    delete roles[role]
                }
            }
            let r = await User.updateOne({email}, {$set: {roles: Object.keys(roles)}});
            if(r.acknowledged){
                res.json({
                    success: true,
                    updatedRoles: roles
                })
            } else {
                res.status(500).json({
                    success: false
                })
            }
        } catch(e){
            sendError(res, e);
        }
    },

    async updateScopes(req, res){
        try {
            const {isAdmin} = req;
            if(!isAdmin) throw new OnlyAdminAccess();

            let {roleId, name, scopes} = req.body;
            if(!roleId || !name || scopes.length == 0) throw new IncompleteData();
            let _scopes = {};
            scopes.forEach( s => {
                let [ent, perm] = s.split(":");
                if(!isNaN(parseInt(perm)) && parseInt(perm) < 3 && parseInt(perm) >= 0)
                _scopes[ent] = parseInt(perm);
            }) 

            let r = await Role.updateOne({_id: mongoose.Types.ObjectId(roleId), name}, {
                $set: {scopes: _scopes}
            })
            if(r.acknowledged){
                await updateRoleList();
                res.json({
                    success: true,
                    scopes: RoleList[name].scopes
                })
            } else {
                res.json({success: false})
            }
        } catch(e){
            sendError(res, e);
        }
    }
}