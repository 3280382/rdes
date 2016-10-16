var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var socketio = require('socket.io')();

function HttpMongoClient(mongo)
{
    if(mongo) this.init(mongo);
};

HttpMongoClient.prototype.init = function(mongo){
    if(!mongo) mongo = {};
    this.host = mongo.host || "localhost";
    this.port = mongo.port || 27017;
    this.dbName = mongo.dbName || "rdes";
    this.connString =  "mongodb://" + this.host + ":" + this.port + "/" + this.dbName;
    console.log(this.connString);

    this.db = null;
    this.router = null;
    this.collections = [];
};

//{"jsonrpc": "2.0", "method": "subtract", "params": {name:"name1"}, "objectName":tst,"id": 1}
HttpMongoClient.prototype.createSocketio = function(path,http){
    socketio.serveClient(false);
    socketio.path(path);
    socketio.attach(http);


    socketio.on('connection', function(socket){
        console.log('a client connected');
        socket.on('jsonrpc', function(obj){
            if(!obj) return;
      //      if(!obj.jsonrpc) socket.emit

        });
    });
};

HttpMongoClient.prototype.createRESTFul = function(){
    this.connect();
    var router = express.Router();
    router.get("/:objectName/:id", function(req, res, next) {
        var collection = this.db.collection(req.params.objectName);
        collection.findOne({id:req.params.id},{}, function(err,doc) {
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
            collection.insertOne(req.body,function(err,r){
                res.json(r);
                res.end();
            });
        }
    });

    this.router = router;
    return this.router;
};

HttpMongoClient.prototype.connect = function(){
    MongoClient.connect(this.connString, function(err, db) {
        if(err){
            console.error(err);
            return;
        }
        console.log("connect@"+this.connString);
        this.db =db;
    });
};

var httpMongoClient = new HttpMongoClient();

module.exports = httpMongoClient;