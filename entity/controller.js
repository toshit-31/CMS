const {sendError, IncompleteData} = require("../errors");
const routeSettingParser = require("./utils/routeSettingParser");
const updateApiAccess = require("./utils/updateApiAccess");
const apiRouter = require("./init");
const {MongoClient} = require("mongodb");
let db = null;
MongoClient.connect(process.env.MONGO_URL+"/"+process.env.DB_NAME).then(c => {
    db = c.db(process.env.DB_NAME).collection("entities");
})

module.exports = {
    async createEntity(req, res){
        try {
            let {name, schema, routeSetting} = req.body;
            let {get, create, update} = routeSetting;
            if(!name || !schema || !routeSetting) throw new IncompleteData();
            if(routeSetting.delete && get && create && update) throw new IncompleteData();
            let rs = routeSettingParser(name, routeSetting);
            let r = await db.insertOne({
                name,
                eid: name.toLowerCase(),
                schema,
                routeSetting: rs.raw
            });
            if(r.insertedId){
                const router = apiRouter.dynamicLoad(req.app, req.body);
                res.json({
                    success: true,
                    id: r.insertedId,
                    entityName: name,
                    routes: rs.raw
                })
            } else res.sendStatus(500);
        } catch(e){
            sendError(res, e);
        }
    },

    async getEntityDetail(req, res){
        try {
            let {eid} = req.query;
            let r = await db.findOne({eid}, {projection: {parsedRouteSetting: 0}});
            res.json({
                success : !!r,
                data: r
            })
        } catch(e){
            sendError(res, e);
        }
    },

    async updateSchema(req, res){
        try {
            let {eid} = req.query;
            let body = req.body;
            if(!body) throw new IncompleteData();

            let updateDoc = {};
            if(body.add) {
                updateDoc.$set = {};
                for(let k in body.add){
                    updateDoc.$set["schema."+k] = body.add[k];
                }
            }
            if(body.remove) {
                updateDoc.$unset = {};
                updateDoc.$set.deletedFields = {};
                for(let k in body.remove){
                    updateDoc.$unset["schema."+k] = 0;
                    updateDoc.$set.deletedFields[k] = 0;
                }
            }
            let r = await db.findOneAndUpdate({eid}, updateDoc, {returnDocument: "after"});
            if(r.ok){
                apiRouter.dynamicLoad(req.app, r.value);
                res.json({
                    success: true,
                    updated: r.value
                })
            }
        } catch(e){
            sendError(res, e);
        }
    },

    async updateRouteSetting(req, res){
        try {
            let {eid} = req.query;
            if(!eid || !req.body) throw new IncompleteData();
            let {parsed, raw} = routeSettingParser(eid, req.body);
            let setterDoc = {$set: {}};
            for(let k in raw){
                setterDoc.$set["routeSetting."+k] = raw[k];
            }
            let r = Object.keys(setterDoc.$set).length ? await db.updateOne({eid}, setterDoc) : {acknowledged : 1};
            if(r.acknowledged){
                updateApiAccess(req.app, eid, raw);
                res.json({
                    success: true,
                    data: {
                        changed: raw
                    }
                })
            } else {
                res.json({
                    success: false
                })
            }
        } catch(e){
            sendError(res, e)
        }
    }
}