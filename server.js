var mosca = require('mosca');
const bcrypt = require('bcrypt');
var env = require('./settings');//importing settings file, environment variables
/**************thingSpeak client**************/
// var ThingSpeakClient = require('thingspeakclient');
// var TSclient = new ThingSpeakClient({
//   server:'http://10.129.139.139:3000',
//   updateTimeout:20000
// });

/***************Adding websocket feature*******/
// var uuid = require('node-uuid');
// var WebSocketServer = require('ws').Server,
//     wss = new WebSocketServer({port: 8180});
// var wscon=null;
// var clients=[];
  ///////////////////////
////initiating the bunyan log
var Logger = require('bunyan');
var log = new Logger({name:'Messenger-Log', 
         streams: [
    {
      level: 'info',
      stream: process.stdout            // log INFO and above to stdout
    },
    {
      level: 'error',
      stream: process.stderr            // log ERROR and above to stdout
    },
    {
      level: 'warn',
      stream: process.stdout            // log warning and above to stdout
    },
    {
      level: 'error',
      path: './log/messenger.log'  // log ERROR and above to a file
    },
    {
      level: 'warn',
      path: './log/messenger.log'  // log WARNING and above to a file
    },
    {
      level: 'info',
      path: './log/messenger.log'  // log INFO and above to a file
    }
  ]

});
/////////
/////serial config
/*var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort(env.portNo, {
  baudrate: 9600
})*/
/////////////////
var id, start,stop,action,currentime, item, macid, type; //flag=1;
//mqtt config
var mqtt    = require('mqtt');
var mqttaddress=env.mqtt;

//mysql configuration
var mysql      = require('mysql');
/////////////////////////////////
///mongo config
var ascoltatore = {
  //using ascoltatore
  type: 'mongo',        
  url: 'mongodb://localhost:27017/mqtt',
  pubsubCollection: 'ascoltatori',
  mongo: {}
};

///mysql
var localdb_config={
  host     : env.localhost,
  user     : env.user,
  password : env.password,
  // socketPath: '/var/run/mysqld/mysqld.sock',
  database : env.database
}
// var thingspeak_config={ //for thingspeak
//   host     : env.mhost2,
//   user     : env.user,
//   password : env.password2,
//   socketPath: '/var/run/mysqld/mysqld.sock',
//   database : env.database2//thingspeak
// }
var connection = mysql.createConnection(localdb_config);
// var thingspeak = mysql.createConnection(thingspeak_config);
connection.connect();//general
log.info("Database connection initialised");
// thingspeak.connect();//thingspeak
//configuration ended
 
var settings = {
  port: env.mport,
  host: env.mhost,
  backend: ascoltatore,
  persistence: {
    factory: mosca.persistence.Mongo,
    url: 'mongodb://localhost:27017/mqtt'
  }
};

///////////////
// // Accepts the connection if the username and password are valid
// var authenticate = function(client, username, password, callback) {
//   var authorized = (username === 'admin' && password.toString() === 'password');
//   if (authorized) client.user = username;
//   callback(null, authorized);
// }

// // In this case the client authorized as admin can publish to topic taking
// // the username from the topic and verifing it is the same of the authorized user
// var authorizePublish = function(client, topic, payload, callback) {
//   callback(null, client.user == topic.split('/')[1]);
// }

// // In this case the client authorized as admin can subscribe to /users/alice taking
// // the username from the topic and verifing it is the same of the authorized user
// var authorizeSubscribe = function(client, topic, callback) {
//   callback(null, client.user == topic.split('/')[1]);
// }
////////////// 
var server = new mosca.Server(settings);
//device discovery
server.on('clientConnected', function(client) {
    var val=client.id;
    log.info('Client connected '+val)
   
});

server.on('unsubscribed', function(topic, client) { //checking if the device goes offline
    var val=client.id;
    //var date = new Date();
    log.info('client unsubscribed', client.id);

});
// fired when a message is received 
server.on('published', function(packet, client) {
  //var date = new Date();
  var topic=packet.topic; //get value of payload
  // var regex1 = /^([0-9a-f]{2}[:-]){5}([0-9a-f]{2})$/;
  // topic=topic.toString();
  // log.info('Client id is '+client.id+' ');
  // log.info('Published topic '+packet.topic);
  // packet = JSON.stringify(packet.payload)
  
  if(packet.topic=='register')//request for registering the user
  {
    var obj = JSON.parse(packet.payload);//highly imprtant step
    log.info('Published username '+obj.username)
    var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(emailRegex.test(client.id))//regex.test(post.username))//check if the username is the regex in email format form
      { 
        let hash = bcrypt.hashSync(obj.password, 10);
        var createLogin='INSERT INTO user_details (username, name, email, contact, gender, role) VALUES (\''+obj.username+'\', \''+obj.name+'\',\''+obj.username+'\',\''+obj.contact+'\', \''+obj.gender+'\',1)'
        connection.query(createLogin, function(err, rows, fields) { //insert into the table 
          if (err) 
          {
            log.error("MYSQL ERROR "+err);
            log.warn("User already exist, try different email id");
          }
          else{
            log.info('New User found, adding '+client.id+' into user_details table');
            log.info("User connected")
            findUseriId(obj.username, function(id){//id look-up for particular username
              var createUser='INSERT INTO login (user_id, username, password) VALUES ('+id+', \''+obj.username+'\',\''+hash+'\')'
              connection.query(createUser, function(err, rows, fields) { //insert into the table 
                if (err) 
                {
                  log.error("MYSQL ERROR "+err);
                  //some transacion error may occer, login entry created but this entry may not be created
                }
                else{
                  log.info('New User found, adding '+obj.username+' into login table');
                }
              });              
            });

          }
        });
      }
      else
      {
        log.error("Wrong username format, must be email");
        //add json error msg here
      }

  }
  if(packet.topic=='connect')//request for registering the user
  {
    var obj = JSON.parse(packet.payload);
    var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(emailRegex.test(client.id))//check if the username is the regex in email format form
    { 
      var check='SELECT password FROM login WHERE username=\''+obj.username+'\''; //checking if the user/password exists or not
      connection.query(check, function(err, rows, fields) 
      {
      
        if (err) 
          log.error("MYSQL ERROR "+err);
        else{
          if(rows.length>0){
              storedPass = rows[0].password;//retrieving stored password
              // let hash = bcrypt.hashSync(toString(packet.payload), 10);
              if(bcrypt.compareSync(obj.password, storedPass)) {
               log.info('Passwords matched')
              } else {
               log.warn('Passwords not matched')
              }
          }
          else
            log.warn('User '+obj.username+' does not exist')
        }
      });//query check ended
      
    }//email regex compare
    else
    {
      log.error("Wrong username format, must be email");
    }

  }
  if(packet.topic=='search')//search for an email id
  {
    var obj = JSON.parse(packet.payload);
    var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(emailRegex.test(obj.email))//check if the username is the regex in email format form
    { 
      var check='SELECT * FROM user_details WHERE username=\''+obj.email+'\''; //checking if the user/password exists or not
      connection.query(check, function(err, rows, fields) 
      {      
        if (err) 
          log.error("MYSQL ERROR "+err);
        else{
          if(rows.length>0){//email found
              name = rows[0].name;//retrieving stored name
              email = rows[0].email;//retrieving stored email
              gender = rows[0].gender;//retrieving stored gender
              // let hash = bcrypt.hashSync(toString(packet.payload), 10);
              var jsonS={
                "name":name,
                "email": email,
                "gender" : gender
              };
              //send it back to user
              //choose topic search

          }
          else
            log.warn('User '+obj.email+' does not exist')
        }
      });//query check ended
      
    }//email regex compare
    else
    {
      log.error("Wrong username format, must be email");
    }

  }
  if(packet.topic=='invite')//invite user for chat
  {
    var obj = JSON.parse(packet.payload);
    var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(emailRegex.test(obj.email))//check if the username is the regex in email format form
    { 
      var check='SELECT id FROM user_details WHERE username=\''+obj.email+'\''; //checking if the user/password exists or not
      connection.query(check, function(err, rows, fields) 
      {      
        if (err) 
          log.error("MYSQL ERROR "+err);
        else{
          if(rows.length>0){//email found
              id1 = rows[0].id;//retrieving stored userid
              findUseriId(obj.username, function(id2){//id look-up for particular username
                var createUser='INSERT INTO friends_map (user_id_1, user_id_2, topic) VALUES ('+id1+', \''+id2+'\',\''+Math.random().toString(36).substr(2, 7)+'\')'
                connection.query(createUser, function(err, rows, fields) { //insert into the table 
                  if (err) 
                  {
                    log.error("MYSQL ERROR "+err);
                    //some transacion error may occer, login entry created but this entry may not be created
                  }
                  else{
                    log.info('New User found, adding '+obj.username+' into login table');
                  }
                });              
              });


          }
          else
            log.warn('User '+obj.email+' does not exist')
        }
      });//query check ended
      
    }//email regex compare
    else
    {
      log.error("Wrong username format, must be email");
    }

  }

     
  
});
 
server.on('ready', setup);//running the server
 
// fired when the mqtt server is ready 
function setup() {
  // server.authenticate = authenticate;
  // server.authorizePublish = authorizePublish;
  // server.authorizeSubscribe = authorizeSubscribe;
  log.info('Mosca server is up and running on '+env.mhost+':'+env.mport);

}

//////////////////////////////////


/******************************
*function: findUseriId(username, callback)
*input: takes username
*output; callback, returns the concerend user id
*logic: finds user id by the username, it will be used  inserting into the login table
*
*/
function findUseriId(username, callback){
  //log.info("macid "+name);
    var query='Select id from user_details where username=\''+username+'\'';
    connection.query(query,function(err,rows,fields){
      if(err)
        log.error('Error in finding userid from user_details table, '+err);
      else{
        //log.info('Channel id ',rows[0].id," for sensor ",name);
        if(rows.length>0){
          callback(rows[0].id);
        }
        else
          callback(0);//no id found
      }
  });
}


/******************************
*function: localdbDisconnect()
*input: none
*output; return new connection to mysql db
*logic: check if connection is lost, then tries to connect again, for handling localdb connection
*
*********************************/
function localdbDisconnect() {
  connection = mysql.createConnection(localdb_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
     //log.error('error when connecting to db:', err);
      setTimeout(localdbDisconnect, 2000); //introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    //log.error('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      localdbDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

connection.on('error', function(err) {
    log.error('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      localdbDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });

