var mqtt    = require('mqtt');
//var pub  = mqtt.connect('tcp://0.0.0.0:61620',{encoding:'utf8', clientId: 'Publishers'});
var pub  = mqtt.connect('mqtt://127.0.0.1:1883',{encoding:'utf8', clientId: 'jayantjnp@gmail.com'});
 
//pub.on();
//pub.publish('esp/12-31-13-AA-FD-43', '12-31-13-AA-FD-433005', {retain:false, qos: 0});
pub.publish('register', 'jayants123', {retain:true, qos: 0});
// var jsonS={
// 	"deviceId":1223,
// 	"status":0
// };
// pub.publish('jsonn', JSON.stringify(jsonS), {retain:true, qos: 0});
pub.end();