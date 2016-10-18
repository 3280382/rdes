var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var socketio = require('socket.io')();

function HttpMongo(mongo){
    if(mongo) this.init(mongo);
};

HttpMongo.prototype.init = function(mongo){
    if(!mongo) mongo = {};
    this.host = mongo.host || "localhost";
    this.port = mongo.port || 27017;
    this.dbName = mongo.dbName || "rdes";
    this.connString =  "mongodb://" + this.host + ":" + this.port + "/" + this.dbName;
    console.log(this.connString);

    this.db = null;
    this.router = null;
    this.routerJsonrpc = null;
    this.collections = [];

    this.connect();
};

//{"jsonrpc": "2.0", "method": "subtract", "params": {name:"name1"}, "objectName":tst,"id": 1,"unid":1}
HttpMongo.prototype.createSocketio = function(url,http){
    //socketio.serveClient(false);
    //socketio.path(url);
    socketio.attach(http);

    socketio.on('connection', function(socket){
        console.log("a client connected");
        socket.on('jsonrpc', function(obj){
            console.log("jsonrpc:"+JSON.stringify(obj));
            if(!obj) return;

            var collection = global.db.collection(obj.objectName);
            var method = obj.method.toLocaleLowerCase();
            var unid = obj.unid;
            var id = obj.id;
            var params = obj.params;
            var result = {"jsonrpc": "2.0",id:id,unid:unid};
            switch(method)
            {
                case "get":
                    collection.findOne({id:id}, function(err,doc) {
                        if(err) {
                            result.error = err;
                        }
                        else {
                            result.result = "ok";
                        }
                        socket.emit("jsonrpc", result);
                    });
                    break;
                case "post":
                    collection.insertOne(params,function(err,r){
                        if(err) {
                            result.error = err;
                        }
                        else {
                            result.result = "ok";
                        }
                        socket.emit("jsonrpc", result);
                    });
                    break;
                case "delete":
                    collection.deleteOne({id:id},{}, function(err,r) {
                        if(err) {
                            result.error = err;
                        }
                        else {
                            result.result = "ok";
                        }
                        socket.emit("jsonrpc", result);
                    });
                    break;
                case "put":
                    collection.updateOne({id:id},params,function(err,r){
                        if(err) {
                            result.error = err;
                        }
                        else {
                            result.result = "ok";
                        }
                        socket.emit("jsonrpc", result);
                    });
                    break;
            }

        });
    });
};

HttpMongo.prototype.createRESTFul = function(){
    var router = express.Router();
    router.all("*",function (req, res, next) {
        console.log(req.url+"?"+JSON.stringify(req.params)+"@"+JSON.stringify(req.body)+"#"+JSON.stringify(req.query));
        next();
    });

    router.get("/:objectName/:id", function(req, res, next) {
        var collection = this.db.collection(req.params.objectName);
        collection.findOne({id:req.params.id}, function(err,doc) {
            res.json(doc);
            res.end();
        });
    });

    router.post("/:objectName", function(req, res, next) {
        if(req.body){
            var collection = this.db.collection(req.params.objectName);
            collection.insertOne(req.body,function(err,r){
                res.json(r);
                res.end();
            });
        }
    });

    router.delete("/:objectName/:id", function(req, res, next) {
        var collection = this.db.collection(req.params.objectName);
        collection.deleteOne({id:req.params.id},{}, function(err,r) {
            res.json(r);
            res.end();
        });
    });

    router.put("/:objectName/:id", function(req, res, next) {
        if(req.body){
            var collection = this.db.collection(req.params.objectName);
            collection.updateOne({id:req.params.id},req.body,function(err,r){
                res.json(r);
                res.end();
            });
        }
    });

    this.router = router;
    return this.router;
};

//{"jsonrpc": "2.0", "method": "subtract", "params": {name:"name1"}, "id": "1"}
// <-- {"jsonrpc": "2.0", "result": "ok", "id": 3}
//<-- {"jsonrpc": "2.0", "error": {"code": -32601, "message": "Method not found"}, "id": "1"}
HttpMongo.prototype.createJsonrpc = function(){
    var router = express.Router();
    router.all("*",function (req, res, next) {
        console.log(req.url+"?"+JSON.stringify(req.params)+"@"+JSON.stringify(req.body)+"#"+JSON.stringify(req.query));
        next();
    });

    router.post("/:objectName", function(req, res, next) {
        if(req.body){
            var collection = this.db.collection(req.params.objectName);
            var method = req.body.method.toLocaleLowerCase();
            var id = req.body.id;
            var params = req.body.params;
            var result = {"jsonrpc": "2.0",id:id};
            switch(method)
            {
                case "get":
                    collection.findOne({id:id}, function(err,doc) {
                        if(err) {
                            result.error = err;
                        }
                        else {
                            result.result = "ok";
                        }
                        res.json(result);
                        res.end();
                    });
                    break;
                case "post":
                    collection.insertOne(params,function(err,r){
                        if(err) {
                            result.error = err;
                        }
                        else {
                            result.result = "ok";
                        }
                        res.json(result);
                        res.end();
                    });
                    break;
                case "delete":
                    collection.deleteOne({id:id},{}, function(err,r) {
                        if(err) {
                            result.error = err;
                        }
                        else {
                            result.result = "ok";
                        }
                        res.json(result);
                        res.end();
                    });
                    break;
                case "put":
                    collection.updateOne({id:id},params,function(err,r){
                        if(err) {
                            result.error = err;
                        }
                        else {
                            result.result = "ok";
                        }
                        res.json(result);
                        res.end();
                    });
                    break;
            }
        }
    });

    this.routerJsonrpc = router;
    return this.routerJsonrpc;
};

HttpMongo.prototype.connect = function(){
    MongoClient.connect(this.connString, function(err, db) {
        if(err){
            console.error(err);
            return;
        }
        console.log("connect@"+this.connString);
        this.db =db;
    });
};

var httpMongo = new HttpMongo();

module.exports = httpMongo;