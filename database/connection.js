const {MongoClient} = require("mongodb");

module.exports = function(){
    return new Promise(async (res, rej)=>{
        try {
            let connection = new MongoClient(process.env.process.env.MONGO_URL+"/"+process.env.DB_NAME);
            let client = await connection.connect();
            let db = client.db(process.env.DB_NAME);
            res(db);
        } catch(e){
            console.log(e);
            process.exit(1);
        }  
    })
}