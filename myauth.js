var myserver = require('./server.js');
var operations = require("./lib/operations.js");
var origUser = 'ki';
var origPass = 'ka';


exports.auth = function(req,res,absPath,pool){
     var auth = req.headers['authorization'];
     
     if(!auth){
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.end('<html><head><title>Free Notes Online</title></head><body style="color:green;">Need some creds son</body></html>');
      
     }
     else if(auth){
        
        var splitAuth = auth.split(' ');
        var buf = new Buffer(splitAuth[1],'base64');
        var authToString = buf.toString();
        
        var creds = authToString.split(':');
        var user = creds[0];
        var pass = creds[1];
        
        if(user == origUser && pass == origPass){

            operations.sortPageName(absPath,function(pgName){
                if(pgName != undefined){
                    
                    operations.loadAdminPanelDat(pool,pgName,req,function(pageData){
                        console.log('adminPage');
                        exportProcessUrl(res,absPath,pageData);                         
                    });
                   
                }
            });
            //make admin panel listen to specific admin sockets
           // eventEmit.emit('AdminUser');
        }
     else{  
        res.statusCode = 403;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.end('<html><head><title>Free Notes Online</title><style>body {animation: blinker 1s linear infinite;}@keyframes blinker {50% { opacity: 0; }}</style></head><body style="color:red;">Warning: tracing ip to report google for unauthorized breach</body></html>');
        }
     }  
    
}
