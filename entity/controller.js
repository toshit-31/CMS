const {sendError, IncompleteData} = require("../errors");
const parseRouteSetting = require("./utils/routeSettingParser");
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
            if(!name || !schema || !routeSetting) throw new IncompleteData();
            let {parsedSetting, routeMap} = parseRouteSetting(name, routeSetting, true);
            let r = await db.insertOne({
                name,
                eid: name.toLowerCase(),
                schema,
                routeSetting: routeSetting,
                // parsedRouteSetting: parsedSetting
            });
            if(r.insertedId){
                const router = apiRouter.dynamicLoad(req.app, req.body);
                res.json({
                    success: true,
                    id: r.insertedId,
                    entityName: name,
                    routes: routeMap
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
            let {routeSetting} = req.body
            if(!eid || !routeSetting) throw new IncompleteData();
            let {parsedSetting, routeMap} = parseRouteSetting(eid, routeSetting, true);
            let setterDoc = {$set: {}};
            for(let k in routeMap){
                setterDoc.$set["routeSetting."+k] = routeMap[k];
            }
            let r = await db.updateOne({eid}, setterDoc);
            if(r.modifiedCount){
                updateApiAccess(req.app, eid, parsedSetting);
                res.json({
                    success: true,
                    data: {
                        changed: routeMap
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