const errors = require("../../errors");

function parseUpdateDocument(updoc){
    let pdoc = {
        value: {},
        arrayFilters: []
    };
    
    if(updoc.set) pdoc.value.$set = updoc.set;
    if(updoc.delete) pdoc.value.$unset = updoc.delete;
    if(updoc.arrays){

        // iterate for each array field
        Object.keys(updoc.arrays).forEach( arr_field => {

            if(Object.keys(updoc.arrays[arr_field]).length > 1) throw new errors.UpdateConflict();

            // iterate for update actions in each array
            if(updoc.arrays[arr_field].update) updoc.arrays[arr_field].update.forEach( v => {
                if(!pdoc.value.$set) pdoc.value.$set = {};
                let [match, value] = v.split(":");
                if(!match || !value) throw new errors.BadData()
                let id = arr_field+"e";
                pdoc.value.$set[arr_field+".$["+id+"]"] = value;
                pdoc.arrayFilters.push({[id] : match});
            })

            // iterate for add actions in each array
            if(updoc.arrays[arr_field].add) updoc.arrays[arr_field].add.forEach( value => {
                if(!pdoc.value.$push) pdoc.value.$push = {};
                if(!pdoc.value.$push[arr_field]) pdoc.value.$push[arr_field] = {$each: []};
                pdoc.value.$push[arr_field].$each.push(value);
            })

            // iterate for delete actions in each array
            if(updoc.arrays[arr_field].remove) updoc.arrays[arr_field].remove.forEach( value => {
                if(!pdoc.value.$pullAll) pdoc.value.$pullAll = {};
                if(!pdoc.value.$pullAll[arr_field]) pdoc.value.$pullAll[arr_field] = [];
                pdoc.value.$pullAll[arr_field].push(value);
            })
        })
    }

    return pdoc;
}

module.exports = parseUpdateDocument;