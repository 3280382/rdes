/**
 * Created by duke on 2016/10/17.
 */
function debug(msg){
    $("#msgDiv").append(msg);
}

function RESTFulMongoClient(objectName,url) {
    this.url = url||"restfulmongo" + "/";
    this.objectName = objectName;
};

RESTFulMongoClient.prototype.get = function (id) {
    $.ajax({
        url: this.url + this.objectName + "/" + id,
        data: {},
        type: "GET",
        cache:false,
        dataType: "json",
        complete: function (res, stat) {
            if (stat == "success") {
                debug("成功:" + JSON.stringify(res));
            }
        },
        error: function (res, stat) {
            debug("失败:" + JSON.stringify(res));
        }
    });
};

RESTFulMongoClient.prototype.delete = function ( id) {
    $.ajax({
        url: this.url + this.objectName+ "/" + id,
        data: {},
        type: "DELETE",
        cache:false,
        dataType: "json",
        complete: function (res, stat) {
            if (stat == "success") {
                debug("成功:" + JSON.stringify(res));
            }
        },
        error: function (res, stat) {
            debug("失败:" + JSON.stringify(res));
        }
    });
};

RESTFulMongoClient.prototype.post = function ( object) {
    $.ajax({
        url: this.url + this.objectName,
        data: object,
        type: "POST",
        cache:false,
        dataType: "json",
        complete: function (res, stat) {
            if (stat == "success") {
                debug("成功:" + JSON.stringify(res));
            }
        },
        error: function (res, stat) {
            debug("失败:" + JSON.stringify(res));
        }
    });
};

RESTFulMongoClient.prototype.put = function ( id, object) {
    $.ajax({
        url: this.url + this.objectName+ "/" + id,
        data: object,
        type: "PUT",
        cache:false,
        dataType: "json",
        complete: function (res, stat) {
            if (stat == "success") {
                debug("成功:" + JSON.stringify(res));
            }
        },
        error: function (res, stat) {
            debug("失败:" + JSON.stringify(res));
        }
    });
};


function JsonrpcMongoClient(objectName,url) {
    this.url = url||"jsonrpcmongo" + "/";
    this.objectName = objectName;
};

//{"jsonrpc": "2.0", "method": "subtract", "params": {name:"name1"}, "id": "1"}
JsonrpcMongoClient.prototype.jsoncall = function (method,id,params) {
    var jsonrpcObject ={"jsonrpc": "2.0",method:method,params:params,id:id};
    $.ajax({
        url: this.url + this.objectName,
        data: JSON.stringify(jsonrpcObject),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        type: "POST",
        cache:false,
        complete: function (res, stat) {
            if (stat == "success") {
                debug("成功:" + JSON.stringify(res));
            }
        },
        error: function (res, stat) {
            debug("失败:" + JSON.stringify(res));
        }
    });
};

function WsMongoClient(objectName,url) {
    this.url = "/"+ (url||"wsmongo");
    this.objectName = objectName;

    //this.socket = io(this.url);
    this.socket = io("http://" + window.location.host );
    this.socket.on('jsonrpc', function(result){
        debug("jsonrpc:"+JSON.stringify(result)+"<br>");
    });
};

//{"jsonrpc": "2.0", "method": "subtract", "params": {name:"name1"}, "objectName":tst,"id": 1,"unid":1}
WsMongoClient.prototype.jsoncall = function (method,id,params) {
    var jsonrpcObject ={"jsonrpc": "2.0",
        method:method,params:params,id:id,
        objectName:this.objectName,unid:(new Date).getTime()
    };
    console.log(JSON.stringify(jsonrpcObject));
    this.socket.emit("jsonrpc", jsonrpcObject);
};