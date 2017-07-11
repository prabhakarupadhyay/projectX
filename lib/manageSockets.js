var fs = require('fs');
var handleSql = require("./sql tables/handleSql.js");
var operations = require("./operations.js");
var Datastore = require("./datastore.js");

var socketCache = [];


exports.listen = function(io,pool,datastore,bucket){
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
        receiveSockets(socket,pool,datastore,bucket);
             
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


    
    function receiveSockets(socket,pool,datastore,bucket){
        
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
        
        socket.on('ShopData',function(socketDat){
            
            eventEmit.emit('shopPath',[socketDat.Name+"/shop_"+socketDat.Shop_Number+"/"]);
            
            handleSql.fromEmailToId(pool,socketDat,SchemaName.Shop.UserSchema,function(jsonData){
                
                handleSql.checkShopSubId(pool,jsonData,SchemaName.Shop.Schema,function(diceyJson){
                    
                    if(!diceyJson){
                        
                        //geneate sub id
                       
                        operations.generateShopSubId(jsonData,function(realJson){
                           //for post shop image request
                            eventEmit.emit('pushShopId',{Shop_Sub_Id:realJson.Shop_Sub_Id});
                            shopDataHandler(pool,realJson);
                            
                        });
                        
                    }else{
                        eventEmit.emit('pushShopId',{Shop_Sub_Id:diceyJson.Shop_Sub_Id});
                        shopDataHandler(pool,diceyJson);
                        
                    }
                    //
                    
                });
          
            });
            
        });
        
        
        socket.on('availableCars',function(socketDat){
            
            handleSql.fromEmailToId(pool,socketDat,SchemaName.Shop.UserSchema,function(jsonData){
                
                handleSql.checkShopSubId(pool,jsonData,SchemaName.Shop.Schema,function(diceyJson){
                    
                    if(!diceyJson){
                        operations.generateShopSubId(jsonData,function(realJson){
                            
                            operations.prepareJsonForDatastore(realJson.Shop_Sub_Id,realJson.Car_Names,function(datastorejson){
                            
                                Datastore.feedDatastore(datastore,datastorejson,'SHOPS','CARS_AVAILABLE',function(storeRes){ 
                                    console.log(storeRes)
                                }); 
                            });
                        });
                    }else{
                        
                        operations.prepareJsonForDatastore(diceyJson.Shop_Sub_Id,diceyJson.Car_Names,function(datastorejson){
                            Datastore.feedDatastore(datastore,datastorejson,'SHOPS','CARS_AVAILABLE',function(storeRes){ 
                                console.log(storeRes);
                            }); 
                        });
                    }
                });
          
            });            
            
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



/**************SOME MORE FUNCTIONS******************/


function shopDataHandler(pool,realJson){               
    splitShopNumber(realJson,function(jsonShopNum){
                
        handleSql.manageQueries(pool,realJson,'ShopData',SchemaName.Shop.Schema,function(status,dat){
            console.log(status);
            console.log(dat); 
            
            if(status){
                handleSql.manageQueries(pool,jsonShopNum,'ShopNumbers',SchemaName.Shop.numberSchema,function(status2,dat2){
                    console.log(status2);
                    console.log(dat2);                   
                });
            } 
        });              
    });   
}




function partFtpData(jsonData,callback){
     
    var shopImages = jsonData.Shop_Images;
    delete jsonData['Shop_Images'];
    callback(jsonData,shopImages); 
}
    
       

function splitShopNumber(dat,callback){
    
    var newJsonNumbers = {};
    newJsonNumbers['Number'] = dat['Number'];
    newJsonNumbers['Shop_Sub_Id'] = dat['Shop_Sub_Id'];
    delete dat['Number'];
    callback(newJsonNumbers);
}




