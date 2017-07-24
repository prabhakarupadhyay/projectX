var fs = require('fs');
var handleSql = require("./sql tables/handleSql.js");
var operations = require("./operations.js");
var Datastore = require("./datastore.js");

var socketCache = [];

exports.listen = function(fireDatastore,pool,datastore,bucket){
    
    var socketChannelPath = 'Channels/Sockets';                 
    var socketChannel = fireDatastore.ref(socketChannelPath);
    var adminSocketChannel = fireDatastore.ref("Channels/AdminSockets");
   // var notifChannel = fireDatastore.ref('Channels/notification/');  

    socketChannel.on("value", function(socket) {
        if(socket.val() != null && socket.val() != undefined){
            changeEventData(socket.val());
           sortValueChange(fireDatastore,socket.val(),socketChannelPath,function(clientObj,socketChannelRes){
                receiveUserSockets(socketChannelRes,clientObj,pool,datastore,bucket);
            });
            
        }
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
    
    
    adminSocketChannel.on("value", function(socket) {
        if(socket.val() != null && socket.val() != undefined){
           // changeEventData(socket.val());
            receiveAdminSockets(adminSocketChannel,socket.val(),pool,datastore,bucket);
            receiveEvents(adminSocketChannel);
        }
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });    
     
}


function changeEventData(dataChange){
    
    console.log('\n-------------------------------');
    console.log('event change called : ');
    console.log(dataChange);    
    console.log('\n-------------------------------');

}

    function receiveAdminSockets(socketChannelRes,clientObj,pool,datastore,bucket){
        
        if(clientObj.Event_Name == "ShopData"){
            delete clientObj.Event_Name;
            
            eventEmit.emit('shopPath',[clientObj.Name+"/shop_"+clientObj.Shop_Number+"/"]);
            
            handleSql.fromEmailToId(pool,clientObj,SchemaName.Shop.UserSchema,function(jsonData){
            
                if(jsonData != undefined){    
                    
                    handleSql.checkShopSubId(pool,jsonData,SchemaName.Shop.Schema,function(diceyJson){
                        if(!diceyJson){
                            //geneate sub id
                            operations.generateShopSubId(jsonData,function(realJson){
                                //for post shop image request
                                eventEmit.emit('pushShopId',{Shop_Sub_Id:realJson.Shop_Sub_Id});
                                shopDataHandler(pool,realJson,socketChannelRes);
                            });
                        }else{
                            eventEmit.emit('pushShopId',{Shop_Sub_Id:diceyJson.Shop_Sub_Id});
                            shopDataHandler(pool,diceyJson,socketChannelRes);
                        }
                    });
                }else{
                    eventEmit.emit('pushShopId',{Shop_Sub_Id:undefined});
                    socketChannelRes.set("invalid email: owner not registered.");
                }
            });       
        
        }
      
          
        if(clientObj.Event_Name == "availableCars"){
            delete clientObj.Event_Name;     
            handleSql.fromEmailToId(pool,clientObj,SchemaName.Shop.UserSchema,function(jsonData){
                
                handleSql.checkShopSubId(pool,jsonData,SchemaName.Shop.Schema,function(diceyJson){
                    
                    if(!diceyJson){
                        operations.generateShopSubId(jsonData,function(realJson){ 
                            operations.prepareJsonForDatastore(realJson.Shop_Sub_Id,realJson.Car_Names,function(datastorejson){
                                Datastore.feedDatastore(datastore,datastorejson,'SHOPS','CARS_AVAILABLE',function(storeRes){ 
                                    socketChannelRes.set(storeRes);
                                }); 
                            });
                        });
                    }else{
                        
                        operations.prepareJsonForDatastore(diceyJson.Shop_Sub_Id,diceyJson.Car_Names,function(datastorejson){
                            Datastore.feedDatastore(datastore,datastorejson,'SHOPS','CARS_AVAILABLE',function(storeRes){ 
                                socketChannelRes.set(storeRes);
                            }); 
                        });
                    }
                });
          
            });
            
        }  
        
        
        if(clientObj.Event_Name == "modelLinkWeb"){
            delete clientObj.Event_Name;  
            var splitKey = clientObj.req.file.storedPath.split('_');
            clientObj.req.file.storedPath = '';
            for(let i in splitKey){
                if(i == splitKey.length-1){
                    clientObj.req.file.storedPath += splitKey[i];
                }else{
                    clientObj.req.file.storedPath += splitKey[i]+'/';
                }
                
            }
            operations.StoreFilesDb(clientObj.req,pool,datastore,function(resLink){
                socketChannelRes.set(resLink);
            });
        }
    }


    
    function receiveUserSockets(socketChannelRes,clientObj,pool,datastore,bucket){
                    
        if(clientObj.Event_Name == "UserData"){
            delete clientObj.Event_Name;
            operations.extractIdFromToken(pool,clientObj,'User',false,function(DatWithId){
                
                handleSql.manageQueries(pool,DatWithId,'UserData',SchemaName.User.PerSchema,function(status,dat){
                    
                    if(status){
                        socketChannelRes.set("userData saved successfully");
                    }else{
                        socketChannelRes.set("userData could not save.Try again");
                    }
        
                });
                
            });
        }
       
        
        
        if(clientObj.Event_Name == "ShopOwnerData"){
            delete clientObj.Event_Name;
            operations.extractIdFromToken(pool,clientObj,'Shop',false,function(DatWithId){  
                handleSql.manageQueries(pool,DatWithId,'ShopOwnerData',SchemaName.Shop.UserPerSchema,function(status,dat){

                    if(status){
                        socketChannelRes.set("ShopOwnerData saved successfully");
                    }else{
                        socketChannelRes.set("ShopOwnerData could not save.Try again");
                    }
                   
                });                
            
            });
        }
        
         
        
        
        if(clientObj.Event_Name == "deleteTokValue"){
            delete clientObj.Event_Name;
            
            var schemaName;
            if(clientObj.Array_info[0].split('_')[0] == "User"){
                schemaName = SchemaName.User.Schema;
            }else{
                schemaName = SchemaName.Shop.UserSchema;
            }
            handleSql.deleteValue(pool,clientObj.Array_info,schemaName,function(delRes){
                console.log(delRes); 
            });
            
        }
        
    }





function receiveEvents(socketChannelRes){
    
//    eventEmit.on('LoggedInUser',function(sessionId){
//        
//        //push all authorized user info and shop info here
//        console.log(sessionId);
//    });
//    
//    
//     
//    eventEmit.on('GuestUser',function(sessionInfo){
//        console.log('----->>>>>');
//        //push all guest user info and shop info here
//        console.log(sessionInfo);
//        
//    });
    
}



/**************FEW MORE FUNCTIONS******************/

function shopDataHandler(pool,realJson,socketChannelRes){
    
    splitShopNumber(realJson,function(jsonShopNum){
                
        handleSql.manageQueries(pool,realJson,'ShopData',SchemaName.Shop.Schema,function(status,dat){
            console.log(status);
            socketChannelRes.set(dat);
            
            if(status){
                handleSql.manageQueries(pool,jsonShopNum,'ShopNumbers',SchemaName.Shop.numberSchema,function(status2,dat2){
                    console.log(status);
                    socketChannelRes.set(dat);                   
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

function sortValueChange(fireDatastore,socketVal,socketChannelPath,callback){
    
    let splitValue = Object.keys(socketVal);//splitValue[0] contains the firebase id of user
    var clientObj = socketVal[splitValue[0]];
    var channel2 = fireDatastore.ref(socketChannelPath+'/'+splitValue[0]);
    callback(clientObj,channel2);
    
}


