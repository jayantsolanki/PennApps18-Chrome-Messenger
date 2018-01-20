var mqtt    = require('mqtt');
//var pub  = mqtt.connect('tcp://0.0.0.0:61620',{encoding:'utf8', clientId: 'Publishers'});
var pub  = mqtt.connect('mqtt://10.103.226.26:1883',{encoding:'utf8', clientId: 'jayantjnp@gmail.com'});
 
//pub.on();
//pub.publish('esp/12-31-13-AA-FD-43', '12-31-13-AA-FD-433005', {retain:false, qos: 0});
// pub.publish('register', 'jayants123', {retain:true, qos: 0});
var jsonS={
	"username":'parik@gmail.com',
	"password":'parik00',
	"name" : 'Parikshit',
	"gender" :  'Male',
	"contact" : 123456789
};
// var jsonS={
// 	"username":'parik@gmail.com',//host
// 	"email":'rohit@gmail.com',//for friend
// };
pub.publish('hello', JSON.stringify(jsonS), {retain:true, qos: 0});
pub.end();
