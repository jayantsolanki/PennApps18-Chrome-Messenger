var mqtt = require('mqtt');
var client = mqtt.connect('ws://10.103.226.26:3000',{encoding:'utf8', clientId: 'subscriber'});
client.on('connect', function(){
    client.subscribe('jayantjnp@gmail.comjayants',{qos:0});
   
});
client.on('message', function(topic, msg, client){
    console.log('Received Message:'+msg);
    
});