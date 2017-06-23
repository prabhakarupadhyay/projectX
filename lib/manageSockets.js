var fs = require('fs');
var handleSql = require("./sql tables/handleSql.js");
var operations = require("./operations.js");

var socketCache = [];


exports.listen = function(io,pool){
    io.set('transports', ['websocket', 
                      'flashsocket', 
                      'htmlfile', 
                      'xhr-polling', 
                      'jsonp-polling', 
                      'polling']);
   
    io.sockets.on("connection",function(socket){
       // connectSocket(socket);
        joinRoom(socket);
        receiveEvents(socket,pool);
        receiveSockets(socket,pool);
             
    });
    
}


function joinRoom(socket){
    
    socket.on('join',function(room){
        
        console.log('room joined: '+ room);
        socket.join(room);
        // socket.emit('UserToken',socketCache[socket.id]);
        console.log(socket.id);
        
    });
      
}


    function connectSocket(socket){
        //take basic details of the user entering the admin panel
        var address = socket.handshake.address;
        console.log('client connected to '+socket.id+' admin-socket ID');
        console.log('New connection from ' + address.address + ':' + address.port);
        console.log('clients IP adress: '+socket.request.connection.remoteAddress);
    }


    
    function receiveSockets(socket,pool){
        
        socket.on('UserData',function(data){
            
            operations.extractIdFromToken(pool,data,'User',false,function(DatWithId){
                
                handleSql.manageQueries(pool,DatWithId,'UserData',SchemaName.User.PerSchema,function(status,dat){
                    
                    console.log(status);
                    console.log(dat);
        
                });
                
            });
            
        });
        
        socket.on('ShopOwnerData',function(data){
              
            operations.extractIdFromToken(pool,data,'Shop',false,function(DatWithId){
                
                handleSql.manageQueries(pool,DatWithId,'ShopOwnerData',SchemaName.Shop.UserPerSchema,function(status,dat){

                    console.log(status);
                    console.log(dat);                    
                
                });                
            
            });
            
        });
        
        socket.on('ShopData',function(data){
            
            handleSql.manageQueries(pool,jsonData,'ShopData',SchemaName.Shop.Schema,function(status,dat){
                        
            });
            //pass shopimages to store in cloud storage    
            
        });
        
        socket.on('ShopImages',function(data){
            
               
            handleSql.manageQueries(pool,jsonData,'ShopImages',SchemaName.Shop.ImageSchema,function(status,dat){
                    
                    
                    
                });
            //pass shopimages to store in cloud storage    
            
        });
        
          socket.on('ShopNumbers',function(data){
        
              handleSql.manageQueries(pool,jsonData,'ShopNumbers',SchemaName.Shop.numberSchema,function(status,dat){
                    
                    
                    
                });     
              //pass shopimages to store in cloud storage    
            
        });
        
    }



function receiveEvents(socket,pool){
    
    eventEmit.on('LoggedInUser',function(sessionId){
        
        //push all authorized user info and shop info here
        console.log(sessionId);
    });
    
    
     
    eventEmit.on('GuestUser',function(sessionInfo){
        console.log('----->>>>>');
        //push all guest user info and shop info here
        console.log(sessionInfo);
        
    });  
    
}


    function partFtpData(jsonData,callback){
     
    var shopImages = jsonData.Shop_Images;
    delete jsonData['Shop_Images'];
    callback(jsonData,shopImages);
    
}
    
       







