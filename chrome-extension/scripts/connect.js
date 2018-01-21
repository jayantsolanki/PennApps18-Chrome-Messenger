  $(document).ready(function() {
  $("#btn").click(function(e){
    e.preventDefault(); 
   var jsonData = {};
   
   var formData = $("#myform").serializeArray();
  // console.log(formData);
   
   $.each(formData, function() {
        if (jsonData[this.name]) {
           if (!jsonData[this.name].push) {
               jsonData[this.name] = [jsonData[this.name]];
           }
           jsonData[this.name].push(this.value || '');
       } else {
           jsonData[this.name] = this.value || '';
       }
         
     
   });
   // $('#result').text(JSON.stringify(formData));
   // console.log(jsonData);

   // var mqtt    = require('mqtt');
    //var pub  = mqtt.connect('tcp://0.0.0.0:61620',{encoding:'utf8', clientId: 'Publishers'});
    var client  = mqtt.connect('ws://10.103.226.26:3000',{encoding:'utf8', clientId: Math.random().toString(36).substr(2, 7)});
    // console.log(document.getElementById("myform").username.value)
    uniqueTopic = document.getElementById("myform").username.value + document.getElementById("myform").password.value
      // console.log(uniqueTopic)
    client.on('connect', function(){
    client.subscribe(uniqueTopic, {qos:0});
    console.log('subscribed')
       
    });
    client.on('message', function(topic, msg, Client){
        console.log('Received Message:'+msg)
        // if(topic === uniqueTopic)
          // client.end();
        
    });
    client.publish('connect', JSON.stringify(jsonData), {retain:false, qos: 0});
    
    
});
});