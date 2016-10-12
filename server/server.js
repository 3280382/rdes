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
	res.send('<h1>Welcome Realtime Server：</h1>');
});

var wsConsole;

app.get('/msg', function(req, res){
	    		console.log(req.headers['user-agent']);
        // 1. 设定头信息
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
	    		 // 2. 输出内容，必须 "data:" 开头 "\n\n" 结尾（代表结束）
	        setInterval(function () {
	            res.write("data: " + Date.now() + "\n\n");
	            console.log(req.headers['user-agent']);
	        }, 1000);
	    	}
});

//在线用户
var onlineUsers = {};
//当前在线人数
var onlineCount = 0;

socketio.on('connection', function(socket){
	console.log('a user connected');
	
	//监听新用户加入
	socket.on('login', function(obj){
		//将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
		socket.name = obj.userid;
		
		//检查在线列表，如果不在里面就加入
		if(!onlineUsers.hasOwnProperty(obj.userid)) {
			onlineUsers[obj.userid] = obj.username;
			//在线人数+1
			onlineCount++;
		}
		
		//向所有客户端广播用户加入
		socketio.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
		console.log(obj.username+'加入了聊天室');
	});
	
	//监听用户退出
	socket.on('disconnect', function(){
		//将退出的用户从在线列表中删除
		if(onlineUsers.hasOwnProperty(socket.name)) {
			//退出用户的信息
			var obj = {userid:socket.name, username:onlineUsers[socket.name]};
			
			//删除
			delete onlineUsers[socket.name];
			//在线人数-1
			onlineCount--;
			
			//向所有客户端广播用户退出
			socketio.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
			console.log(obj.username+'退出了聊天室');
		}
	});
	
	//监听用户发布聊天内容
	socket.on('message', function(obj){
		//向所有客户端广播发布的消息
		socketio.emit('message', obj);
		console.log(obj.username+'说：'+obj.content);
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
  oriArray[2] = "13751880344";//这里是你在微信开发者中心页面里填的token，而不是****
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

var wechat = require('wechat');

//app.use(express.query());//app.use(connect.query()); // Or
app.use('/wechat', wechat('13751880344', function (req, res, next) {
	// message is located in req.weixin

	var message = req.weixin;
	wsConsoleLog(JSON.stringify(message));
	if (message.FromUserName === 'diaosi') {
		// reply with text
		res.reply('hehe');
	} else if (message.FromUserName === 'text') {
		// another way to reply with text
		res.reply({
			content: 'text object',
			type: 'text'
		});
	} else if (message.FromUserName === 'hehe') {
		// reply with music
		res.reply({
			type: "music",
			content: {
				title: "Just some music",
				description: "I have nothing to lose",
				musicUrl: "http://mp3.com/xx.mp3",
				hqMusicUrl: "http://mp3.com/xx.mp3"
			}
		});
	} else {
		// reply with thumbnails posts
		if (message.MsgType === 'text') {
			res.reply({
				content: 'you said:'+message.Content,
				type: 'text'
			});

		}
		else {
			res.reply([
				{
					title: 'Come to fetch me',
					description: 'or you want to play in another way ?',
					picurl: 'http://nodeapi.cloudfoundry.com/qrcode.jpg',
					url: 'http://nodeapi.cloudfoundry.com/'
				}
			]);
		}
	}
}));

http.listen(port, function(){
	console.log('listening on *:'+port);
	console.log('__dirname:'+__dirname);
});