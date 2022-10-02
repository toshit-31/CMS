const Router = require("express").Router;
const mongoose = require("mongoose");
const { sendError } = require("../../errors");
const parseUpdateDocument = require("../utils/parseUpdateDocument");
/**
 * 
 * @param {mongoose.Model} entity 
 * @returns {Router}
 */
module.exports = function(entity, delProj){
    let api = {
        async get(req, res){
            try {
                const {user} = req;
                // const {filter} = req.body;
                let {skip, limit, sort} = req.query;
                let opts = {}
                if(skip) opts.skip = skip;
                if(limit) opts.limit = limit;
                if(sort) {
                    let [, key, asc] = sort.match(/(\w+),([-]?1)/i) || [];
                    if(key && asc) opts.sort = sort;
                }
                let filter = {};
                if(user) filter = {byUser : {$in: [user._id, "any"]}}
                else filter.byUser = "any";

                let proj = {...delProj, "byUser": 0};
                let result = await entity.find(filter, proj, opts).exec();
                
                res.json({
                    count: result.length,
                    data: result
                })
            } catch(e){
                sendError(res, e);
            }
        },

        async create(req, res){
            try {
                const {user} = req;
                const data = req.body;
                data.byUser = user ? user._id : "any";

                let e = new entity(data);
                let result = await e.save();
                
                res.json({
                    insertedId: result._id.toString()
                })
            } catch(e){
                sendError(res, e);
            }
        },

        async getbyid(req, res){
            try {
                const {user} = req;
                const {id} = req.params;
                let filter = {_id: mongoose.Types.ObjectId(id)};
                if(user) filter.byUser = {$in: [user._id, "any"]}
                else filter.byUser = "any";

                let proj = {...delProj, "byUser": 0};
                let result = await entity.find(filter, proj).exec();

                res.json({
                    success: !!result,
                    data: result
                })
            } catch(e){
                sendError(res, e);
            }
        },

        async updatebyid(req, res){
            try {
                const {user} = req;
                const {id} = req.params;
                const upsert = !!req.query.upsert;
                let filter = {_id: mongoose.Types.ObjectId(id)};
                if(user) filter.byUser = {$in: [user._id, "any"]}
                else filter.byUser = "any";

                let updateDoc = parseUpdateDocument(req.body);
                let result = await entity.updateOne(filter, updateDoc.value, {upsert, arrayFilters: updateDoc.arrayFilters || {}}).exec();

                if(result.acknowledged){
                    res.json({
                        success: true
                    })
                } else {
                    res.json({
                        success: false
                    })
                }
            } catch(e){
                sendError(res, e)
            }
        },

        async deletebyid(req, res){
            try {
                const {user} = req;
                const {id} = req.params;
                let filter = {_id: mongoose.Types.ObjectId(id)};
                if(user) filter.byUser = {$in: [user._id, "any"]}
                else filter.byUser = "any";

                let proj = {...delProj, "byUser": 0}
                let result = await entity.findOneAndDelete(filter, {projection: proj}).exec();

                res.json({
                    success: !!result,
                    data: result
                })
            } catch(e){
                sendError(res, e);
            }
        }
    }

    const r = Router();
    r.get("/", api.get);
    r.post("/", api.create);
    r.get("/:id", api.getbyid);
    r.put("/:id", api.updatebyid);
    r.delete("/:id", api.deletebyid);
    return r;
}