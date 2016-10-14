var redis = require('redis');
var client = redis.createClient(); //creates a new client,By default, redis.createClient() will use 127.0.0.1 and 6379 

client.on('connect', function() {
    console.log('connected');
    
    client.set('redisclientID', 'redisclient123456789');
    
    client.get('redisclientID', function(err, reply) {
    console.log(reply);
	});
});