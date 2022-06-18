#! /usr/bin/env node
const args = process.argv
const {exit} = process;
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const r = readline.createInterface({
    input: process.stdin
})
const { MongoClient } = require("mongodb");

function byPassInterruption(){
    console.log("[interruption detected] Wait for the process to complete ...")
}

function bindDataFromQuestion(ans, key){
    if(!ans.length) {
        console.log("No answers can be blank")    
        process.exit(1)
    }
    console.log(key, ans)
    this[key] = ans
}

const parseVars = function(str){
    let [k, v] = str.split("=");
    let key = k.substring(2);
    return [key, v];
}

switch(args[2]){
    // start the server and update the settings
    case "start" : {
        const server = require("../server");

        for(let i = 3; i < args.length; i++){
            let [key, value] = parseVars(args[i])
            switch(key){
                case "port": {
                    let v = parseInt(value);
                    if(!isNaN(value) && Math.floor(v) == parseFloat(value)){
                        process.env.PORT = v;
                    } else break;
                }
            }
        }
        server.start();
        break;
    }
    case "setup": {
        // server setup process
        let envvar = {MONGO_URL: '', CONTENT_BASE: 'api', DB_NAME: '', SECRET: ''}
        for(let i = 3; i < args.length; i++){
            let [key, value] = parseVars(args[i])
            switch(key){
                case "mongo-url": {
                    if(!!value.length){
                        envvar.MONGO_URL = value;
                    } else {
                        console.log("empty mongodb url")
                        exit(1);
                    }
                    break;
                };
                case "content-base": {
                    if(!!value.length){
                        envvar.CONTENT_BASE = value;
                    }
                    break;
                }
                case "db": {
                    if(!!value.length){
                        envvar.DB_NAME = value;
                    } else {
                        console.log("no database name provided");
                        exit(1);
                    }
                    break;
                }
                case "secret": {
                    let secretPath = path.join(__dirname, "..", value)
                    if(fs.existsSync(secretPath)){
                        envvar.SECRET = fs.readFileSync(secretPath).toString();
                        break;
                    } else {
                        console.log("invalid or non-existent file path");
                        exit(1);
                    }
                }
            }
        }
        if(!envvar.MONGO_URL){
            console.log("--mongo-url option is required")
            exit(1);
        }
        if(!envvar.DB_NAME){
            console.log("--db option is required")
            exit(1);
        }
        if(!envvar.SECRET){
            console.log("--secret option is required and should be a valid file path")
            exit(1);
        }
        str=""
        for(let key in envvar){
            str+=key+'='+envvar[key]+'\n';
        }
        process.on("SIGINT",  byPassInterruption)
        // process.on("SIGSTOP", byPassInterruption)
        // process.on("SIGKILL", byPassInterruption)
        let adminData = {
            firstName: 'First Name',
            lastName: 'Last Name',
            password: 'password',
            createdBy: 'admin',
            email: 'admin@cms.com',
            roles: ['admin'],
            isAdmin: true,
        }
        // r.question("First Name : ", bindDataFromQuestion.bind(adminData, "firstName"))
        // r.question("Last Name : ", bindDataFromQuestion.bind(adminData, "lastName"))
        // r.question("Password : ", bindDataFromQuestion.bind(adminData, "password"))
        // r.question("Email : ", bindDataFromQuestion.bind(adminData, "email"))
        // r.close();
        // configure the initial data in database
        MongoClient.connect(envvar.MONGO_URL).then(async (client) => {
            let db = client.db(envvar.DB_NAME);
            await db.collection("users").insertOne(adminData);
        }).then(function(){
            // write to env file
            fs.writeFileSync(path.join(__filename, "..", "..", ".env"), str);
            exit(0);
        }).catch(e => {
            console.log(e);
            exit(1);
        })
        break;
    }
    case "clean": {
        // remove the data from env and db
        require("dotenv").config();
        MongoClient.connect(process.env.MONGO_URL).then(async (client) => {
            let db = client.db(process.env.DB_NAME);
            await db.dropDatabase();
            let envPath = path.join(__filename, "..", "..", ".env");
            fs.writeFileSync(envPath, "MONGO_URL=\nCONTENT_BASE=\nDB_NAME=\nSECRET=")
            exit(0);
        }).catch(e => {
            console.log(e);
            exit(1);
        })
    }
}