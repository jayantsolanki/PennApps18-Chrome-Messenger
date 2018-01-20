var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://127.0.0.1:1883',{encoding:'utf8', clientId: 'subscriber'});
client.on('connect', function(){
    client.subscribe('hello',{qos:0});
   
});
client.on('message', function(topic, msg, client){
    console.log('Received Message:'+msg);
    
});