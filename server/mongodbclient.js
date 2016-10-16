var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/rdes2';	
var insertData = function(db, callback) {  
 
  var collection = db.collection('account2');
  var data = [{"name":'wilson001',"age":21},{"name":'wilson002',"age":22}];
  collection.insert(data, function(err, result) { 
    if(err)
    {
      console.log('Error:'+ err);
      return;
    }	 
    callback(result);
  });
}
MongoClient.connect(DB_CONN_STR, function(err, db) {
  console.log("connect");
  insertData(db, function(result) {
    console.log(result);
    var collection = db.collection('account2');
    collection.find();
    db.close();
  });
});