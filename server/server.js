var fs = require('fs');
var path = require('path');
var url = require("url");
var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var socketio = require('socket.io')(http);
var compression = require('compression');  
var crypto = require("crypto");

var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');

//app.use(compression()); 
app.use(express.static(path.join(__dirname, 'www')));       

app.get('/', function(req, res){
	res.send('<h1>Welcome Realtime Server��</h1>');
});

var wsConsole;

app.get('/msg', function(req, res){
	    		console.log(req.headers['user-agent']);
        // 1. �趨ͷ��Ϣ
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });
        
        if(req.query.console)
        {
        	wsConsole = res;
	       	//wait console log
	      }
	    	else
	    	{
	    		 // 2. ������ݣ����� "data:" ��ͷ "\n\n" ��β�����������
	        setInterval(function () {
	            res.write("data: " + Date.now() + "\n\n");
	            console.log(req.headers['user-agent']);
	        }, 1000);
	    	}
});

//�����û�
var onlineUsers = {};
//��ǰ��������
var onlineCount = 0;

socketio.on('connection', function(socket){
	console.log('a user connected');
	
	//�������û�����
	socket.on('login', function(obj){
		//���¼����û���Ψһ��ʶ����socket�����ƣ������˳���ʱ����õ�
		socket.name = obj.userid;
		
		//��������б������������ͼ���
		if(!onlineUsers.hasOwnProperty(obj.userid)) {
			onlineUsers[obj.userid] = obj.username;
			//��������+1
			onlineCount++;
		}
		
		//�����пͻ��˹㲥�û�����
		socketio.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
		console.log(obj.username+'������������');
	});
	
	//�����û��˳�
	socket.on('disconnect', function(){
		//���˳����û��������б���ɾ��
		if(onlineUsers.hasOwnProperty(socket.name)) {
			//�˳��û�����Ϣ
			var obj = {userid:socket.name, username:onlineUsers[socket.name]};
			
			//ɾ��
			delete onlineUsers[socket.name];
			//��������-1
			onlineCount--;
			
			//�����пͻ��˹㲥�û��˳�
			socketio.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
			console.log(obj.username+'�˳���������');
		}
	});
	
	//�����û�������������
	socket.on('message', function(obj){
		//�����пͻ��˹㲥��������Ϣ
		socketio.emit('message', obj);
		console.log(obj.username+'˵��'+obj.content);
	});
  
});


function sha1(str){
  var md5sum = crypto.createHash("sha1");
  md5sum.update(str);
  str = md5sum.digest("hex");
  return str;
}

function wsConsoleLog(str)
{
	console.log(str);
	if(wsConsole)	wsConsole.write("data: "+Date.now() + str + "\n\n");
}

function logReq(req)
{
  wsConsoleLog("req.originalUrl:" + req.originalUrl);
  wsConsoleLog("req.query:"+JSON.stringify(req.query));
  var ips = req.ips ? req.ips.join(",") : req.ip;
  wsConsoleLog("req.ips:"+ips);
  wsConsoleLog("req.body:"+req.body);
}


function validateToken(req,res){  
	var query = req.query;
  var signature = query.signature;
  var echostr = query.echostr;
  var timestamp = query['timestamp'];
  var nonce = query.nonce;
  var oriArray = new Array();
  oriArray[0] = nonce;
  oriArray[1] = timestamp;
  oriArray[2] = "13751880344";//����������΢�ſ���������ҳ�������token��������****
  oriArray.sort();
  var original = oriArray.join('');
  console.log("Original str : " + original);
  console.log("Signature : " + signature );
  var scyptoString = sha1(original);
  console.log("scyptoString : " + scyptoString );
  if(signature == scyptoString){
    res.end(echostr);
    console.log("Confirm and send echo back");
  }else {
    res.end("false");
    console.log("Failed!");
  }
}

app.get('/weixin/vt', function(req, res){
	logReq(req);
	validateToken(req,res);
});

app.post('/weixin/vt', function(req, res){
	logReq(req);
	res.end("ok");
});

http.listen(port, function(){
	console.log('listening on *:'+port);
	console.log('__dirname:'+__dirname);
});